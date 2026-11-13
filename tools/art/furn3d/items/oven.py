# かまど（oven）：いまの絵のデザインのまま。石をつんだ、うえがまるいかまど。前の下に、レンガの口（アーチ）。中の火のへやで火がもえる（3コマでうごく）。うしろの上に煙突。
# 設計図（じっさいに建てられる組み方。単位はマス。石もレンガも、きまった大きさの材をつむ。けずるのは、口・屋根のまるみに合わせた石のはしだけ）
#   ぜんたい：はば0.92・おく0.60。まっすぐなかべは高さ0〜0.30、その上は半円の石のアーチ屋根（外の半径0.46・かべのあつさ0.12、てっぺん0.76）。
#   石：1こ はば0.18（かべにそった長さ）・高さ0.10・あつさ0.12。1だんごとに半分ずらしてつむ（やくものつみ）。石ごとに少し色がちがう。石のテクスチャ。
#     かべ：左・右（おく向きにならべる）・うしろ（よこにならべる）。高さ0〜0.30（3だん）。
#     前のかべ・うしろのかべ：まっすぐな所と、屋根の半円の形をふさぐ「つま」。石をつみ、屋根の半円のふちと、口のレンガのふちで、石のはしをけずる。
#     屋根：まるい屋根は、くさびの形の石7こを、半円にならべたアーチ（アーチ石）。おく向きに、長さ0.18ずつ、半分ずらしてならべる。
#   口：前のかべの下、まん中。はば0.40（半径0.20）、アーチのはじまり（立ち上がり）は高さ0.24。
#     レンガ：1こ 0.24×0.12×あつさ0.12（どれも同じ大きさ）。
#       口の両わきの柱：レンガをよこにおいて2だん（高さ0〜0.24、はば0.24）。
#       アーチ：レンガ12こを、くさびの形にけずって（外のはば0.12 → 内のはば0.05、長さ0.24）、長い辺を半径の向きに半円にならべる（内の半径0.20・外の半径0.44）。両はしは柱の上にのる。あいだはモルタル（はば0.008）。
#   火のへや：かべ・屋根でかこまれた中（はば0.68・おく0.36）。ゆかは石の床板（高さ0〜0.03）。中の面は、すすでくらい灰茶（くろくしない）。
#   火：火のへやの中、口のすぐおく（前のかべから0.03おく）の床に、まき2本と、火3つ（まん中が大きい）。コマごとに火の形がかわる（common.flame）。
#   煙突：屋根のてっぺんのうしろより（アーチ石をつらぬく）。こい灰色の石のまるい筒（外の半径0.11・穴の半径0.07・高さ0.62〜0.84）。穴の中はすす。
from blueprint import Part as P
from common import *
import math
from shapely.geometry import Polygon,box as sbox,Point
from shapely.ops import unary_union
ID='oven';BOTTOM=43;GRAD=True;FRAMES=3
VIEWS=[('oven',0)]
FR=0
CX,CY=0.50,0.60;HW,HD,T=0.46,0.30,0.12;ZW=0.30
SL,SH=0.18,0.10   # 石の長さ・高さ
RI,RO,ZS=0.20,0.44,0.24   # 口のアーチの内・外の半径、立ち上がりの高さ
BL_,BH_=0.24,0.12   # レンガの長さ・高さ（あつさはかべと同じ T）
YF,YB=CY+HD,CY-HD
SHADES=[(206,196,184),(194,184,172),(214,204,192),(188,178,168),(200,192,178),(210,198,182)]
BRICKS=[(204,108,74),(196,100,70),(210,116,80)]
SOOT,SOOT2=(128,104,94),(104,86,80)
def semi(cx,cz,r,n=48):return [(cx+r*math.cos(math.pi*i/n),cz+r*math.sin(math.pi*i/n)) for i in range(n+1)]
def gable():   # 前・うしろのかべの形：まっすぐな所と半円
    return Polygon([(CX+HW,0.0),(CX+HW,ZW)]+semi(CX,ZW,HW)[1:-1]+[(CX-HW,ZW),(CX-HW,0.0)])
def mouth_region(r):   # 口（アーチの形。r は半径）
    return unary_union([sbox(CX-r,0,CX+r,ZS),Point(CX,ZS).buffer(r,64).intersection(sbox(CX-r,ZS,CX+r,ZS+r))])
def soot(x,y,z):   # 火のへやの中の面・口のトンネルの面は、すす
    inner=abs(x-CX)<HW-T-0.004 and YB+T+0.004<y<YF-T-0.004 and math.hypot(x-CX,max(0,z-ZW))<HW-T-0.004
    tun=y<YF-0.004 and y>YF-T-0.01 and abs(x-CX)<RI-0.003 and (z<ZS or math.hypot(x-CX,z-ZS)<RI-0.003)
    if inner or tun:return SOOT2 if y<YF-T-0.15 else SOOT
    return None
def piece(nm,poly,y0,y1,col,on,note,grp=None):
    out=[];polys=[poly] if poly.geom_type=='Polygon' else [g for g in getattr(poly,'geoms',[]) if g.geom_type=='Polygon']   # 線や点だけの切れはしは、すてる
    for k,pg in enumerate(polys):
        if pg.area<1e-5:continue
        p=P(nm if k==0 else '%s-%d'%(nm,k),'prism',(list(pg.exterior.coords)[:-1],y0,y1,'y'),col,on=on,note=note,grp=grp);p.stone=True;p.decal=soot;out.append(p)
    return out
def wall_xz(nm,region,y0,y1,rows):   # 前・うしろのかべ：x にそった石を、だんごとに半分ずらしてならべ、region で切る
    L=[];prev=('ground',)
    for r in range(rows):
        z0=r*SH;off=SL/2 if r%2 else 0;names=[]
        x=CX-HW-off;i=0
        while x<CX+HW:
            blk=sbox(x,z0,x+SL,z0+SH).intersection(region);x+=SL;i+=1
            if blk.is_empty:continue
            col=SHADES[(i*5+r*3+len(nm))%len(SHADES)]
            for p in piece('%s石%d-%d'%(nm,r+1,i),blk,y0,y1,col,prev+tuple('アーチのレンガ%d'%q for q in range(1,13)),'%sのかべの石。%dだんめ'%(nm,r+1)):L.append(p);names.append(p.name)
        prev=tuple(names) or prev
    return L
def PARTS():
    L=[]
    g=gable();brick_area=unary_union([mouth_region(RO),sbox(CX-RO,0,CX+RO,ZS)])
    rows=int(math.ceil((ZW+HW)/SH))
    L+=wall_xz('前',g.difference(brick_area),YF-T,YF,rows)
    L+=wall_xz('うしろ',g,YB,YB+T,rows)
    for nx,x0 in(('左',CX-HW),('右',CX+HW-T)):   # 左・右のかべ（まっすぐな所）：おく向きにならべる
        prev=('ground',)
        for r in range(3):
            z0=r*SH;off=SL/2 if r%2 else 0;y=YB+T-off;i=0;names=[]
            while y<YF-T-1e-6:
                a_,b_=max(y,YB+T),min(y+SL,YF-T);y+=SL;i+=1
                if b_-a_<0.01:continue
                p=P('%sのかべ石%d-%d'%(nx,r+1,i),'box',(x0,a_+0.002,z0+0.002,x0+T,b_-0.002,z0+SH),SHADES[(i*3+r+len(nx))%len(SHADES)],on=prev,bevel=0.008,note='%sのかべ'%nx);p.stone=True;p.decal=soot;L.append(p);names.append(p.name)
            prev=tuple(names)
    # 屋根：アーチ石（くさびの形7こ）を、おく向きに長さ0.18ずつ、半分ずらしてならべる
    NV=7;ri,ro=HW-T,HW
    for v in range(NV):
        a0,a1=math.pi*v/NV,math.pi*(v+1)/NV
        pts=[(CX+ri*math.cos(a0),ZW+ri*math.sin(a0)),(CX+ro*math.cos(a0),ZW+ro*math.sin(a0)),(CX+ro*math.cos((a0+a1)/2),ZW+ro*math.sin((a0+a1)/2)),(CX+ro*math.cos(a1),ZW+ro*math.sin(a1)),(CX+ri*math.cos(a1),ZW+ri*math.sin(a1))]
        off=SL/2 if v%2 else 0;y=YB+T-off;i=0
        while y<YF-T-1e-6:
            a_,b_=max(y,YB+T),min(y+SL,YF-T);y+=SL;i+=1
            if b_-a_<0.01:continue
            p=P('アーチ石%d-%d'%(v+1,i),'prism',(pts,a_+0.002,b_-0.002,'y'),SHADES[(v*5+i*2)%len(SHADES)],on=tuple('アーチ石%d-%d'%(w,j) for w in(v,v+2) for j in range(1,5))+tuple('%sのかべ石3-%d'%(n_,j) for n_ in('左','右') for j in range(1,5)),note='屋根のアーチ。となりのアーチ石とおしあってささえる（いちばん下は、かべの上）');p.stone=True;p.decal=soot;L.append(p)
    L.append(notex(P('火のへやの床','box',(CX-HW+T,YB+T,0.0,CX+HW-T,YF-T,0.03),SOOT,on=('ground',),bevel=0,note='火のへやの床')))
    # レンガ：口の両わきの柱（よこおき3だん）と、アーチ（たておき9こ）
    for nx,x0 in(('左',CX-RO),('右',CX+RI)):
        for j in range(2):
            q=P('柱のレンガ（%s%d）'%(nx,j+1),'box',(x0+0.002,YF-T,j*BH_+0.002,x0+BL_-0.002,YF,(j+1)*BH_),BRICKS[j%3],on=('ground',) if j==0 else ('柱のレンガ（%s%d）'%(nx,j),),bevel=0.006,note='口のわきの柱');q.tex=False;q.decal=soot;L.append(q)
    NB=12;gap=0.008   # アーチ：レンガを、くさびの形にけずった物（外のはばがレンガのはば0.12にちょうど入る数＝12こ）。あいだはモルタル（はば0.008）
    for i in range(NB):
        a0=math.pi*i/NB+gap/2/RO;a1=math.pi*(i+1)/NB-gap/2/RO;b0=math.pi*i/NB+gap/2/RI;b1=math.pi*(i+1)/NB-gap/2/RI
        pts=[(CX+RI*math.cos(b0),ZS+RI*math.sin(b0)),(CX+RO*math.cos(a0),ZS+RO*math.sin(a0)),(CX+RO*math.cos(a1),ZS+RO*math.sin(a1)),(CX+RI*math.cos(b1),ZS+RI*math.sin(b1))]
        q=P('アーチのレンガ%d'%(i+1),'prism',(pts,YF-T,YF+0.004,'y'),BRICKS[i%3],on=('柱のレンガ（左2）','柱のレンガ（右2）','アーチのレンガ%d'%i,'アーチのレンガ%d'%(i+2)),note='口のアーチ。くさびにけずったレンガ。となりのレンガとおしあってささえる（両はしは柱の上）');q.tex=False;q.decal=soot;L.append(q)
    mor=[(CX+RI*math.cos(math.pi*i/24),ZS+RI*math.sin(math.pi*i/24)) for i in range(25)][::-1]+[(CX+RO*math.cos(math.pi*i/24),ZS+RO*math.sin(math.pi*i/24)) for i in range(25)]
    m=P('アーチのモルタル','prism',(mor,YF-T,YF-0.006,'y'),(214,206,194),on=('柱のレンガ（左2）','柱のレンガ（右2）'),note='アーチのレンガのあいだをうめるモルタル');m.tex=False;m.decal=soot;L.append(m)
    c=P('煙突','ring',(CX,CY-0.10,0.07,0.11,0.62,0.84),(132,124,122),detail=24,on=('アーチ石4-2',),note='屋根のてっぺんのうしろより');c.stone=True;L.append(c)
    L.append(notex(P('煙突の中','cyl',(CX,CY-0.10,0.071,0.62,0.76),(78,66,62),detail=20,on=('煙突',),note='穴の中（すす）')))
    yl=YF-T-0.03
    for k,ang in enumerate((15,-20)):   # まき
        r_=math.radians(ang);L.append(notex(P('まき%d'%(k+1),'beam',((CX-0.12*math.cos(r_),yl-0.04*math.sin(r_),0.055+0.02*k),(CX+0.12*math.cos(r_),yl+0.04*math.sin(r_),0.055+0.02*k),0.025),LOG,on=('火のへやの床',),note='火のへやの床')))
    H=[(0.22,0.12,0.10),(0.25,0.13,0.09),(0.20,0.10,0.12)][FR]   # コマごとの火の高さ（まん中・左・右）
    L.append(flame('火（まん中）',CX,yl,0.07,H[0],0.09,('まき1','まき2')))
    L.append(flame('火（左）',CX-0.11,yl,0.065,H[1],0.055,('まき1',)))
    L.append(flame('火（右）',CX+0.11,yl,0.065,H[2],0.055,('まき2',)))
    names={p.name for p in L}
    for p in L:p.on=tuple(o for o in p.on if o=='ground' or o in names) or p.on   # のる所の一覧から、ない石の名前をのぞく
    return L
