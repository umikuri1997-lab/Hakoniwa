# 柵（板の柵 fence）と丸太の塀（logfence）を、3Dで組んで、ゲームの見え方（oblique3d.game：x, y−0.8z）のドット絵に写す（スキル model3d-pixel）。
# 使い方：python3 tools/art/fence3d/fence3d.py <出力フォルダ> [--chips]
#
# つなぎ方（connMask：左1・右2・上4・下8）の16とおりを、1つずつ、そのマスの中の物だけで組んで写す（<id>:m0〜m15）。
#   ゲームは、どのつなぎ方も、その1まいを描くだけ（drawConn）。前の部品（H0・HL・HR・HLR・VU・VD・VUD）も同じ絵で作る（工房・アイコン用）。
#   よこのつなぎ目：横木・くいは、マスの外までのばして組み、マスのはば（x 0〜64）で切る。木目は1マスでくりかえすので（span 1）、となりとつながる。
#   たてのつなぎ目：たての横木は、上のマスへ少しのばして組み（輪郭線をつけないため）、のばした所と、そのまわりの線だけ、あとで消す。
#   見え方は、ほかの家具（42度）ではなく、ゲームのマスと同じ（1マス＝64ドット四方・高さ0.8）。そうしないと、たての柵がマスごとにつながらない。
#
# 設計図（マス。x=東・y=南・z=上。マスの左上が(0,0)）
# 板の柵：
#   くい：はば0.16・あつさ0.05・高さ0.95（先は0.10の三角）。よこの柵は y 0.895〜0.945、x は 0・0.25・0.5・0.75・1（さかいのくいは、となりと半分ずつ）。
#     たての柵は x 0.45〜0.51（柱のまん中にそろえる）、y のまん中 1/8・3/8・5/8・7/8（先の三角は、おく向き）。
#   柱（はし・角・まじわる所）：0.16角・高さ1.0（先は四角すい0.08）。まん中 (0.5, 0.865)。よこの柵と同じ線。
#   横木：よこは、くい・柱の前（y 0.945〜0.985）、高さ 0.62〜0.76 と 0.16〜0.30。くぎは、くいのまん中。
#     たては、くいの東がわ（x 0.51〜0.55）、同じ高さ。柱のうしろ・前の面にとめる。
# 丸太の塀：
#   丸太：半径1/6・高さ1.0、よこは x のまん中 1/6・1/2・5/6、y のまん中 0.78。たては x 0.5、y のまん中 1/6・1/2・5/6。
#   横木：丸太の前（y 0.94〜0.985）、高さ 0.62〜0.74 と 0.18〜0.30。丸太のさかいに鉄の帯。たては丸太の東がわ。
#   柱：半径0.23・高さ1.33の太い丸太（まん中 (0.5, 0.76)）。上に鉄の輪（びょうつき）、根もとに石。
#   根もとの石：丸太の前に、小さな石をならべる。
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(ROOT,'tools'))
import numpy as np
from PIL import Image
import oblique3d as O
from blueprint import Part,build,barktex
FENCEC=(222,180,118);NAIL=(122,104,90)   # 柵の木の色（オーク。持ち主がきめた）・くぎ
LOGC=(198,142,86);IRON=(128,130,140);STONE=(196,188,180)
TW=O.Tex(os.path.join(ART,'textures','wood049.png'),span=1.0,flow=10,minrun=4)   # 1マスでくりかえす木目（となりのマスとつながる）
TS=O.Tex(os.path.join(ART,'textures','rock030.png'),span=1.0,flow=2,minrun=2,dark=(0.16,0.92),light=(0.14,1.06))
EXT=0.18   # たての横木を上のマスへのばす長さ（あとで消す）
def kept(m,d):return bool(m&d)
def scene_fence(m):
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];Y0,Y1=0.885,0.945;PC=(0.5,0.865)
    def picket_h(cx):   # よこの柵のくい（正面の形をおくへのばす）
        w=0.08;P.append(('picket',Part('くい','prism',([(cx-w,0),(cx+w,0),(cx+w,0.85),(cx,0.95),(cx-w,0.85)],Y0,Y1),FENCEC),(cx%1,0)))
    def picket_v(cy):
        w=0.08;P.append(('picket',Part('くい','prism',([(cy-w,0),(cy+w,0),(cy+w,0.85),(cy,0.95),(cy-w,0.85)],0.45,0.51,'x'),FENCEC),(0,cy%1)))
    for cx in(0,0.25,0.5,0.75,1.0):
        if cx<0.5 and not L or cx>0.5 and not R or cx==0.5 and (post or not(L or R)):continue
        picket_h(cx)
    if not(L or R) and post:pass
    for cy in(0.125,0.375,0.625,0.875):
        if post and abs(cy-PC[1])<0.17:continue
        if cy<PC[1] and not U or cy>PC[1] and not D:
            if not(m==12):continue
        if m==12 or (cy<PC[1] and U) or (cy>PC[1] and D):picket_v(cy)
    if post:
        P.append(('post',Part('柱','box',(0.42,0.785,0,0.58,0.945,0.92),FENCEC),None))
        P.append(('post',Part('柱の先','pyr',(0.5,0.865,0.08,0.08,0.92,1.0),FENCEC),None))
    for z0,z1 in((0.62,0.76),(0.16,0.30)):
        if L or R:
            x0=-0.4 if L else 0.42;x1=1.4 if R else 0.58
            P.append(('railh',Part('横木','box',(x0,0.945,z0,x1,0.985,z1),FENCEC),(0,0)))
            for cx in(0,0.25,0.5,0.75,1.0):
                if x0<=cx<=x1 and not(cx==0.5 and post and not(L and R)) or (cx==0.5 and post and (L or R)):
                    if x0-0.01<=cx<=x1+0.01:P.append(('nail',Part('くぎ','box',(cx-0.016,0.985,(z0+z1)/2-0.016,cx+0.016,0.99,(z0+z1)/2+0.016),NAIL),None))
        if U or D:
            if m==12:segs=[(-EXT,1.0)]
            else:
                segs=[]
                if U:segs.append((-EXT,0.80))   # 柱のうしろの面にとめる
                if D:segs.append((0.985 if L or R else 0.945,1.0))   # 柱の前の面から（よこの横木があれば、その前の面から）
            for y0,y1 in segs:
                if y0<0:
                    P.append(('ext',Part('横木のばし','box',(0.51,y0,z0,0.55,0.0,z1),FENCEC,grp='rv%d'%z0),(0,0)));y0=0.0
                P.append(('railv',Part('横木','box',(0.51,y0,z0,0.55,y1,z1),FENCEC,grp='rv%d'%z0),(0,0)))
    return P
def scene_log(m):
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];r=1/6;YC=0.78;PC=(0.5,0.76);PR=0.23
    for cx in(1/6,0.5,5/6):
        if post and cx==0.5:continue
        if (cx<0.5 and L) or (cx>0.5 and R) or (cx==0.5 and m==3):
            P.append(('log',Part('丸太','log',((cx,YC,0),(cx,YC,1.0),r),LOGC),None))
    for cy in(1/6,0.5,5/6):
        if post and cy>0.6:continue
        if m==12 or (cy<PC[1] and U):P.append(('log',Part('丸太','log',((0.5,cy,0),(0.5,cy,1.0),r),LOGC),None))
    if post:
        P.append(('post',Part('柱','log',((PC[0],PC[1],0),(PC[0],PC[1],1.33),PR),LOGC),None))
        P.append(('iron',Part('鉄の輪','cyl',(PC[0],PC[1],PR+0.018,1.02,1.12),IRON),None))
        P.append(('iron',Part('びょう','box',(0.485,PC[1]+PR+0.012,1.055,0.515,PC[1]+PR+0.028,1.085),(170,172,180)),None))
        for k in range(7):
            a=math.pi*(0.05+0.9*k/6);P.append(('stone',Part('石','ball',(PC[0]+math.cos(a)*(PR+0.02),PC[1]+math.sin(a)*(PR+0.02),0.02,0.055,0.55),STONE),None))
    for z0,z1 in((0.62,0.74),(0.18,0.30)):
        if L or R:
            for x0,x1 in([(-0.4,1.4)] if m==3 else [s_ for s_,c_ in(((-0.4,0.5-PR*0.8),L),((0.5+PR*0.8,1.4),R)) if c_]):
              P.append(('railh',Part('横木','box',(x0,0.94,z0,x1,0.985,z1),LOGC),(0,0)))
              for bx in(0,1/3,2/3,1.0):
                if x0<=bx<=x1 and not(post and abs(bx-0.5)<PR+0.03):P.append(('iron',Part('鉄の帯','box',(bx-0.025,0.932,z0-0.012,bx+0.025,0.993,z1+0.012),IRON),None))
        if U or D:
            segs=[(-EXT,1.0)] if m==12 else [s for s,c in(((-EXT,PC[1]-0.1),U),((PC[1]+0.1,1.0),D)) if c]
            for y0,y1 in segs:
                if y0<0:P.append(('ext',Part('横木のばし','box',(0.667,y0,z0,0.71,0.0,z1),LOGC,grp='rv%d'%z0),(0,0)));y0=0.0
                P.append(('railv',Part('横木','box',(0.667,y0,z0,0.71,y1,z1),LOGC,grp='rv%d'%z0),(0,0)))
                for by in(0,1/3,2/3):
                    if y0<=by<=y1 and not(post and abs(by-PC[1])<PR+0.03):P.append(('iron',Part('鉄の帯','box',(0.66,by-0.025,z0-0.012,0.718,by+0.025,z1+0.012),IRON),None))
    for cx in [q for q in np.arange(0.08,1.0,0.1667)]:   # 根もとの石（よこ）
        if (cx<0.5 and L) or (cx>0.5 and R):
            if post and abs(cx-0.5)<PR+0.04:continue
            P.append(('stone',Part('石','ball',(cx,0.96,0.025,0.07,0.6),STONE),(cx,0)))
    for cy in np.arange(0.08,1.0,0.1667):   # 根もとの石（たて：東がわ）
        if m==12 or (cy<PC[1]-PR and U) or (cy>PC[1]+PR and D):P.append(('stone',Part('石','ball',(0.69,cy,0.025,0.06,0.6),STONE),(0,cy)))
    return P
def render(P):
    sc=O.Scene();sc.txo={};sc.txax={};ext_ids=set()
    for kind,p,org in P:
        if kind=='stone':sc.texture(TS)
        elif kind in('picket','post','railh','railv','ext'):sc.texture(TW)
        else:sc.texture(None)
        sc.material('metal' if kind=='iron' else None);p0=sc.pid;build(sc,[p]);sc.material(None)
        ids=range(p0+1,sc.pid+1)
        if kind=='ext':ext_ids|=set(ids)
        if org is not None and kind in('picket','railh','railv','ext','post'):   # 木目：1マスでくりかえす（となりのマスとつながる）
            for q in ids:
                ax=(1,0,0) if kind=='railh' else (0,1,0) if kind in('railv','ext') else (0,0,1)
                sc.txo[q]=((0,0,0) if kind!='picket' else (org[0],org[1],0),(int(round(org[0]*4))*13+int(round(org[1]*8))*29) if kind=='picket' else 0,11);sc.txax[q]=np.array(ax,float)
    sc.texture(None);O.S=64
    ex=(-0.5,1.5,-2.0,1.25);im=O.render_px(sc,O.game,ex,O.VIEW,k=0.80,lw=2,k2=0.90,merge=4)
    a=np.array(im).copy();ids=O.LAST_IDS
    if ext_ids:   # 上のマスへのばした横木と、そのまわりの線を消す
        em=np.isin(ids,list(ext_ids));own=(ids>=0)&~em;nb=np.zeros_like(em);no=np.zeros_like(em)
        for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):nb|=np.roll(np.roll(em,dy,0),dx,1);no|=np.roll(np.roll(own,dy,0),dx,1)
        a[em]=0;a[(ids<0)&nb&~no]=0
    a=a[:,32:96]   # マスのはば（x 0〜64）で切る
    im=Image.fromarray(a);bb=im.getbbox();return im.crop(bb),bb[0],bb[1]-128
OLD={0:'H0',1:'HL',2:'HR',3:'HLR',4:'VU',8:'VD',12:'VUD'}
def build_all(iid):
    fn=scene_fence if iid=='fence' else scene_log;out={}
    for m in range(16):im,ax,ay=render(fn(m));out[m]=(im,ax,ay)
    return out
def sheet(res,path,layout):
    """ならべた見本（ゲームと同じく、上の行から、左から描く）"""
    Hh=len(layout);Ww=len(layout[0]);can=Image.new('RGBA',(Ww*64+64,Hh*64+160),(150,190,120,255));on=lambda x,y:0<=y<Hh and 0<=x<Ww and layout[y][x]=='#'
    for y in range(Hh):
        for x in range(Ww):
            if not on(x,y):continue
            m=(1 if on(x-1,y) else 0)|(2 if on(x+1,y) else 0)|(4 if on(x,y-1) else 0)|(8 if on(x,y+1) else 0);im,ax,ay=res[m];can.alpha_composite(im,(32+x*64+ax,128+y*64+ay))
    can.save(path);can.resize((can.width*3,can.height*3),Image.NEAREST).save(path.replace('.png','_x3.png'))
LAY=['#####...###',
     '#...#...#.#',
     '#...######.',
     '#####...#..',
     '..#.....#..',
     '..#..#..###',
     '..#........']
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True);chips='--chips' in sys.argv;R={}
    for iid in('fence','logfence'):
        res=build_all(iid);R[iid]=res;sheet(res,os.path.join(out,iid+'_lay.png'),LAY)
        for m,(im,ax,ay) in res.items():im.save(os.path.join(out,'%s_m%d.png'%(iid,m)));print(iid,m,im.size,ax,ay,len(set(map(tuple,np.array(im).reshape(-1,4)[np.array(im).reshape(-1,4)[:,3]>0].tolist()))),'色')
    if chips:
        import chips as CHP
        head,CC=CHP.load_imgs();names=[]
        for iid,res in R.items():
            for m,(im,ax,ay) in res.items():
                for nm in [iid+':m%d'%m]+([iid+':'+OLD[m]] if m in OLD else []):CC[nm]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]};names.append(nm)
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(names));print('チップに入れた',len(names))
