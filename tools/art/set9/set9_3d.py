# 井戸・シーソー・ガーデンアーチ・すべり台・ブランコ・よまわりのランタン・石どうろう・にぐるま・コンポスターの3Dの下絵。
# いまの絵（デザインのお手本）の大きさ・置き方に合わせて組み、角度だけをゲームに合わせる。
# x=東, y=南, z=上（マス）。置くマスは左上が(0,0)。ゲームの見え方は 画面=(x, y-0.8z)。
# 出す絵：ref/sheet.png（絵をたのむときにわたす1まい。左上にお手本のキューブ、9つの物ごとに、左が3D・右がいまの絵。1マス64ドット、黄色いわくが置くマス）
import math,sys,os
from PIL import Image,ImageDraw,ImageFont
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
HERE=os.path.dirname(__file__);ROOT=os.path.join(HERE,'..','..','..')
WOOD=(214,170,120);WOOD2=(190,146,100);STONE=(212,208,200);STONE2=(190,186,178);METAL=(150,156,170);LEAF=(150,200,110);FLOW=(250,236,220)
ROPE=(200,180,150);GLASS=(250,232,160);SAND=(230,214,170);GREEN=(160,200,110)

def well(sc):
    cx,cy=0.5,0.5
    sc.ring_wall(cx,cy,0.42,0,0.42,lambda i,a0,a1:STONE if i%2 else STONE2,n=24)
    sc.annulus(cx,cy,0.3,0.42,0.42,lambda *a:STONE,n=24);sc.annulus(cx,cy,0,0.3,0.3,lambda *a:(120,170,210),n=24)   # 石のふち・水
    for x in (0.1,0.84):sc.box(x,0.44,0.42,x+0.06,0.56,1.05,WOOD2)                                      # 柱
    sc.box(0.1,0.47,0.92,0.9,0.53,0.98,WOOD)                                                             # 巻き上げの横木
    for s in (-1,1):sc.quad((0.0,0.5,1.25),(1.0,0.5,1.25),(1.0,0.5+0.42*s,0.98),(0.0,0.5+0.42*s,0.98),(206,150,104) if s>0 else (186,132,90))   # 切妻の屋根
    sc.tube([(0.5,0.5,0.95),(0.5,0.5,0.62)],0.01,ROPE);sc.box(0.42,0.43,0.48,0.58,0.57,0.62,WOOD2)       # なわ・つるべ
def seesaw(sc):
    sc.box(0.25,0.3,0,0.75,0.7,0.12,SAND,bevel=0.03);sc.box(0.38,0.42,0.12,0.62,0.58,0.36,WOOD2)        # 台と支点
    sc.box(-0.45,0.4,0.36,1.45,0.6,0.42,WOOD)                                                             # 板（動く部品）
    for x in (-0.3,1.24):sc.box(x,0.46,0.42,x+0.06,0.54,0.6,WOOD2);sc.box(x-0.06,0.44,0.56,x+0.12,0.56,0.6,WOOD2)   # 持ち手
def arch(sc):
    """木のパーゴラのアーチ：四すみの角柱、左右の側面ははしごのような格子、上は前後の桁に横木（垂木）をならべ、はしは切りかき。右がわと上につるバラ"""
    X0,X1,Y0,Y1,H=-0.22,1.22,0.18,0.82,1.55;P=0.11
    for x in (X0,X1-P):
        for y in (Y0,Y1-P):sc.box(x,y,0,x+P,y+P,H,WOOD2)                                   # 角柱4本
        for z in (0.35,0.75,1.15):sc.box(x+0.01,Y0+P,z,x+P-0.01,Y1-P,z+0.05,WOOD)          # 側面の横の桟
        for y in (Y0+0.24,Y1-0.29):sc.box(x+0.015,y,0.3,x+P-0.015,y+0.04,1.2,WOOD)        # 側面のたての桟
    for y in (Y0,Y1-P):sc.box(X0-0.16,y,H,X1+0.16,y+P,H+0.14,WOOD)                         # 前後の桁（はしが外へ出る）
    for i in range(7):                                                                     # 上の横木（垂木）
        x=X0-0.06+i*(X1-X0+0.05)/6;sc.box(x,Y0-0.14,H+0.14,x+0.07,Y1+0.14,H+0.22,WOOD2)
    import random;rd=random.Random(3)
    for k in range(26):   # つるバラ：右の側面と上に、葉のかたまりと白い花
        if k<14:x=X1-0.04+rd.uniform(-0.06,0.06);y=rd.uniform(Y0,Y1);z=rd.uniform(0.15,H)
        else:x=rd.uniform(0.4,X1+0.1);y=rd.uniform(Y0-0.05,Y1+0.05);z=H+0.25
        sc.sphere(x,y,z,rd.uniform(0.07,0.11),LEAF)
        if k%3==0:sc.sphere(x+0.02,y+0.06,z+0.04,0.045,FLOW)
def slide(sc):
    sc0=sc
    class T:
        def __getattr__(self,k):
            f=getattr(sc0,k)
            if k in('box',):return lambda x0,y0,z0,x1,y1,z1,*a,**kw:f(x0+DX,y0+DY,z0,x1+DX,y1+DY,z1,*a,**kw)
            if k in('beam',):return lambda a,b,*r,**kw:f((a[0]+DX,a[1]+DY,a[2]),(b[0]+DX,b[1]+DY,b[2]),*r,**kw)
            if k=='quad':return lambda *pts:f(*[(q[0]+DX,q[1]+DY,q[2]) for q in pts[:4]],pts[4])
            return f
    sc=T();DX,DY=0.25,0.42
    P0,P1=0.35,0.95;pz=0.95
    for x in (P0,P1):
        for y in (0.65,1.25):sc.box(x-0.04,y-0.04,0,x+0.04,y+0.04,pz+0.35,WOOD2)
    sc.box(P0-0.04,0.61,pz-0.06,P1+0.04,1.29,pz,WOOD)                                                     # 台
    for y in (0.62,1.26):sc.box(P0,y-0.02,pz+0.3,P1,y+0.02,pz+0.35,WOOD2)                                # 手すり（前・うしろ）
    sc.box(P0-0.02,0.65,pz+0.3,P0+0.02,1.25,pz+0.35,WOOD2)
    for k in range(6):   # 左の階段
        x0=P0-0.12*(k+1);z=pz-0.16*(k+1);sc.box(x0,0.68,max(0,z-0.05),x0+0.13,1.22,max(0.05,z),WOOD)
    for y in (0.66,1.24):sc.beam((P0,y,pz+0.3),(P0-0.72,y,0.25),0.02,WOOD2)
    n=12   # すべり面（右へ、下へ）
    for k in range(n):
        u0,u1=k/n,(k+1)/n;f=lambda u:(P1+1.25*u,pz*(1-u)**1.4+0.05)
        (x0,z0),(x1,z1)=f(u0),f(u1)
        sc.quad((x0,0.72,z0),(x1,0.72,z1),(x1,1.18,z1),(x0,1.18,z0),SAND)
        for y,s in ((0.7,-1),(1.2,1)):sc.quad((x0,y,z0),(x1,y,z1),(x1,y,z1+0.1),(x0,y,z0+0.1),(222,196,150))
def swing(sc):
    for x in (0.34,1.56):sc.box(x-0.04,0.38,0,x+0.14,0.62,0.12,STONE,bevel=0.02);sc.box(x,0.42,0.12,x+0.1,0.58,1.7,WOOD2)   # 柱は少しつめた
    sc.box(0.26,0.43,1.62,1.74,0.57,1.74,WOOD)
    for x in (0.72,1.28):sc.tube([(x,0.5,1.62),(x,0.5,0.42)],0.012,ROPE)   # 座席となわ（動く部品）
    sc.box(0.66,0.4,0.36,1.34,0.6,0.42,WOOD)
def yomawari(sc):
    sc.box(0.38,0.38,0,0.62,0.62,0.06,(120,92,70));sc.box(0.47,0.47,0.06,0.53,0.53,0.72,(110,96,96))   # 台・柱
    sc.box(0.36,0.36,0.72,0.64,0.64,0.76,(96,100,130));sc.box(0.39,0.39,0.76,0.61,0.61,0.98,GLASS)     # ランタン
    sc.revolve(0.5,0.5,[(0.0,1.08),(0.17,0.98)],lambda k,i:(96,100,130),n=8);sc.sphere(0.5,0.5,1.12,0.04,(250,200,110))   # 屋根・星
def toro(sc):
    sc.box(0.2,0.25,0,0.8,0.75,0.08,STONE2,bevel=0.03);sc.box(0.36,0.4,0.08,0.64,0.6,0.32,STONE)         # 台・竿
    sc.box(0.28,0.33,0.32,0.72,0.67,0.38,STONE2);sc.box(0.33,0.38,0.38,0.67,0.62,0.6,STONE)              # 中台・火袋
    sc.box(0.42,0.6,0.43,0.58,0.63,0.56,GLASS)                                                            # 火袋の窓
    sc.part();A=(0.5,0.5,0.76);R=[(0.2,0.24),(0.8,0.24),(0.8,0.76),(0.2,0.76)]   # 笠（四角すい）・宝珠
    for i in range(4):(x0,y0),(x1,y1)=R[i],R[(i+1)%4];sc.tri(A,(x0,y0,0.6),(x1,y1,0.6),STONE2)
    sc.box(0.2,0.24,0.57,0.8,0.76,0.6,STONE2);sc.sphere(0.5,0.5,0.8,0.05,STONE)
def niguruma(sc):
    sc.box(0.05,0.2,0.24,1.35,0.8,0.28,WOOD)                                                              # 床
    for y in (0.2,0.76):sc.box(0.05,y,0.28,1.35,y+0.04,0.48,WOOD2)                                         # 横の板
    for x in (0.05,1.31):sc.box(x,0.2,0.28,x+0.04,0.8,0.48,WOOD2)
    for wx in (0.35,1.05):   # 車輪（よこを向いた円板。手前とおくに、2つずつ）
      for y in (0.14,0.86):
        sc.part()
        for i in range(20):
            a0=2*math.pi*i/20;a1=2*math.pi*(i+1)/20;P=lambda a:(wx+0.18*math.cos(a),y,0.18+0.18*math.sin(a))
            sc.tri((wx,y,0.18),P(a0),P(a1),WOOD2)
    for y in (0.35,0.65):sc.beam((1.35,y,0.38),(1.95,y,0.46),0.025,WOOD2)                                # 引き手
    sc.beam((1.9,0.33,0.46),(1.9,0.67,0.46),0.025,WOOD2)
    sc.sphere(0.5,0.5,0.42,0.13,(240,226,200),zs=0.8)                                                     # 荷物
def composter(sc):
    for i in range(5):
        z=0.02+i*0.13
        for y in (0.08,0.88):sc.box(0.08,y,z,0.92,y+0.04,z+0.1,WOOD)
        for x in (0.08,0.88):sc.box(x,0.08,z,x+0.04,0.92,z+0.1,WOOD)
    for x in (0.08,0.88):
        for y in (0.08,0.88):sc.box(x-0.01,y-0.01,0,x+0.05,y+0.05,0.7,WOOD2)
    sc.box(0.13,0.13,0.4,0.87,0.87,0.62,(140,110,80))
    for (x,y) in ((0.3,0.3),(0.6,0.35),(0.45,0.6),(0.7,0.7),(0.25,0.7)):sc.sphere(x,y,0.64,0.12,GREEN,zs=0.6)
OBJS=[('井戸','well',(1,1),well),('シーソー','seesaw',(1,1),seesaw),('ガーデンアーチ','arch',(1,1),arch),('すべり台','slide',(2,2),slide),('ブランコ','swing',(2,1),swing),
      ('よまわりのランタン','yomawari',(1,1),yomawari),('石どうろう','toro',(1,1),toro),('にぐるま','niguruma',(2,1),niguruma),('コンポスター','composter',(1,1),composter)]
EXT=(-1.0,3.0,-1.5,2.5)
def panel3d(f,foot):
    sc=Scene();f(sc);bg=grid_bg(EXT,foot);bg.alpha_composite(render(sc,game,EXT,VIEW));return bg.resize((bg.width//2,bg.height//2),Image.BOX)
def panelold(id,foot,C):
    bg=grid_bg(EXT,foot);bg=bg.resize((bg.width//2,bg.height//2),Image.BOX);v=C[id];k=1 if v.get('g')==64 else 2
    ox,oy=round(-EXT[0]*64),round(-EXT[2]*64)
    def put(im,ax,ay):im=im.convert('RGBA');im=im.resize((im.width*k,im.height*k),Image.NEAREST);bg.alpha_composite(im,(ox+ax*k,oy+ay*k))
    put(v['f'][0],v['ax'],v['ay'])
    for p in v.get('parts',[]) or []:put(p['f'][0],round(p['ax']),round(p['ay']))
    return bg
if __name__=='__main__':
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
    h,C=chips.load_imgs()
    out=os.path.join(HERE,'ref');os.makedirs(out,exist_ok=True)
    fnt=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',20) if os.path.exists('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc') else ImageFont.load_default()
    PW,PH,G,TH=256,256,12,28;cube=Image.open(os.path.join(HERE,'..','ref','view-cube.png')).convert('RGBA')
    cols=3;cw=PW*2+G;W=G+cols*(cw+G*2);top=cube.height+G*2;Hh=top+3*(PH+TH+G*2)
    sh=Image.new('RGBA',(W,Hh),(255,255,255,255));sh.paste(cube,(G,G));d=ImageDraw.Draw(sh)
    for n,(nm,id,foot,f) in enumerate(OBJS):
        c,r=n%cols,n//cols;x=G+c*(cw+G*2);y=top+r*(PH+TH+G*2)
        d.text((x,y),'%d %s'%(n+1,nm),font=fnt,fill=(60,60,60))
        sh.paste(panel3d(f,foot),(x,y+TH))
        if id=='arch':sc=Scene();f(sc);sd=grid_bg((-1.0,3.0,-3.5,0.5));sd.alpha_composite(render(sc,side,(-1.0,3.0,-3.5,0.5),SIDE));sh.paste(sd.resize((PW,PH),Image.BOX),(x+PW+G,y+TH))   # 新しいデザイン：右はまよこの3D
        else:sh.paste(panelold(id,foot,C),(x+PW+G,y+TH))
    sh.convert('RGB').save(os.path.join(out,'sheet.png'));print('ok',sh.size)
