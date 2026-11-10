# 灯台（lighthouse、2×2マス）の設計図と3Dの下絵。
# 設計図の数字（SPEC）を1か所にまとめ、設計図の絵（plan.png）と3D（3d_full.png ほか）を、どちらもここから作る。
# 単位はマス。x=東, y=南, z=上。置くマスは左上が(0,0)、まん中は(1,1)。ゲームの見え方は 画面=(x, y-0.8z)。
# 大きさは、いまのチップ（見た目のはば約3.2マス・高さ約5.5マス）に合わせる。
# 出す絵（tools/art/lighthouse/ref/）：plan.png（設計図）、3d_full.png（ゲームの見え方・マス目と置くマスのわく）、3d_full_nogrid.png、3d_side.png（まよこ）
import math,sys,os
from PIL import Image,ImageDraw,ImageFont
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
CX,CY=1.0,1.0
N=8   # 灯室・手すりの面の数（八角形）

# ===== 設計図の数字 =====
SPEC=dict(
    base_r=1.0,   base_h=0.3,    # 土台：石の丸い台（半径・高さ）
    tow_r0=0.8,   tow_r1=0.55,   tow_h=3.75,  # 塔：下の半径・上の半径・てっぺんの高さ（白いしっくい、上ほど細い）
    door_w=0.5,   door_h=0.8,    # 入口：はば・高さ（上が半円のアーチ、木のとびら、石のふち0.08）
    win_w=0.16,   win_h=0.3,  win_z=(1.85,2.6),   # 小窓：はば・高さ・下のはしの高さ（2つ、正面に縦にならぶ）
    gal_r=0.82,   gal_z=3.75,  gal_t=0.15,  # 見はらし台の床：半径・床の下・あつさ
    rail_r=0.78,  rail_h=0.28,   # 石の手すり：半径・高さ（すきまのある石のさく、八角形）
    lan_r=0.42,   lan_h=0.9,     # 灯室：半径・高さ（ガラス8まい、赤い枠）
    roof_r=0.52,  roof_h=0.6,    # 屋根：のきの半径・高さ（赤い円すい）
    fin_r=0.06,   fin_h=0.12,    # てっぺんの玉
)
S_=SPEC
gal_top=S_['gal_z']+S_['gal_t']; lan_top=gal_top+S_['lan_h']; roof_top=lan_top+S_['roof_h']; TOP=roof_top+S_['fin_h']

STONE=(214,214,220);STONE2=(198,198,206);WHITE=(244,240,232);WHITE2=(236,231,222)
WOOD=(176,122,78);GLASS=(255,226,140);FRAME=(206,92,74);ROOF=(222,104,84);ROOF2=(210,94,76)

def front_y(r): return CY+r   # 正面のはしの y

def build(sc):
    sp=S_
    # 土台
    sc.ring_wall(CX,CY,sp['base_r'],0,sp['base_h'],lambda i,a0,a1:STONE if i%2 else STONE2,n=32)
    sc.annulus(CX,CY,0,sp['base_r'],sp['base_h'],lambda *a:STONE,n=32)
    # 塔（上ほど細い）
    sc.revolve(CX,CY,[(sp['tow_r1'],sp['tow_h']),(sp['tow_r0'],sp['base_h'])],lambda k,i:WHITE,n=40)
    # 入口：石のふち・木のとびら（正面に少しだけ出す）
    def arch(w,h,col,dz,ofs):
        r=sp['tow_r0']-0.035*(h/sp['door_h'])+ofs;y=CY+r;sc.part()
        x0,x1=CX-w/2,CX+w/2;zr=sp['base_h']+h-w/2
        sc.quad((x0,y,sp['base_h']),(x1,y,sp['base_h']),(x1,y,zr),(x0,y,zr),col)
        for i in range(12):
            a0=math.pi*i/12;a1=math.pi*(i+1)/12
            sc.tri((CX,y,zr),(CX+w/2*math.cos(a0),y,zr+w/2*math.sin(a0)),(CX+w/2*math.cos(a1),y,zr+w/2*math.sin(a1)),col)
    arch(sp['door_w']+0.16,sp['door_h']+0.08,STONE2,0,0.02)
    arch(sp['door_w'],sp['door_h'],WOOD,0,0.04)
    # 小窓
    for z0 in sp['win_z']:
        f=(z0-sp['base_h'])/(sp['tow_h']-sp['base_h']);r=sp['tow_r0']+(sp['tow_r1']-sp['tow_r0'])*f+0.02;y=CY+r
        w,h=sp['win_w'],sp['win_h'];sc.part()
        sc.quad((CX-w/2,y,z0),(CX+w/2,y,z0),(CX+w/2,y,z0+h-w/2),(CX-w/2,y,z0+h-w/2),(110,118,140))
        for i in range(8):
            a0=math.pi*i/8;a1=math.pi*(i+1)/8;zr=z0+h-w/2
            sc.tri((CX,y,zr),(CX+w/2*math.cos(a0),y,zr+w/2*math.sin(a0)),(CX+w/2*math.cos(a1),y,zr+w/2*math.sin(a1)),(110,118,140))
    # 見はらし台の床
    sc.ring_wall(CX,CY,sp['gal_r'],sp['gal_z'],gal_top,lambda *a:STONE2,n=32)
    sc.annulus(CX,CY,0,sp['gal_r'],gal_top,lambda *a:STONE,n=32)
    # 石の手すり：八角形の柱と、上の横木（すきまあり）
    for i in range(N*2):
        a=2*math.pi*(i+0.5)/(N*2);x,y=CX+sp['rail_r']*math.cos(a),CY+sp['rail_r']*math.sin(a)
        sc.box(x-0.045,y-0.045,gal_top,x+0.045,y+0.045,gal_top+sp['rail_h'],STONE)
    for i in range(N):
        a0=2*math.pi*(i+0.5)/N;a1=2*math.pi*(i+1.5)/N
        p=lambda a:(CX+sp['rail_r']*math.cos(a),CY+sp['rail_r']*math.sin(a))
        (x0,y0),(x1,y1)=p(a0),p(a1);z=gal_top+sp['rail_h']
        sc.beam((x0,y0,z-0.03),(x1,y1,z-0.03),0.04,STONE)
    # 灯室：ガラス8まいと赤い枠（八角形）
    for i in range(N):
        a0=2*math.pi*(i+0.5)/N;a1=2*math.pi*(i+1.5)/N;r=sp['lan_r']
        p=lambda a,z:(CX+r*math.cos(a),CY+r*math.sin(a),z);sc.part()
        sc.quad(p(a0,gal_top),p(a1,gal_top),p(a1,lan_top),p(a0,lan_top),GLASS)
        sc.box(*(lambda x,y:(x-0.03,y-0.03,gal_top,x+0.03,y+0.03,lan_top))(*p(a0,0)[:2]),FRAME)
    sc.ring_wall(CX,CY,sp['lan_r']+0.01,gal_top,gal_top+0.1,lambda *a:FRAME,n=N)
    sc.ring_wall(CX,CY,sp['lan_r']+0.01,lan_top-0.06,lan_top,lambda *a:FRAME,n=N)
    # 屋根（円すい）とてっぺんの玉
    sc.revolve(CX,CY,[(0.0,roof_top),(sp['roof_r'],lan_top)],lambda k,i:ROOF if i%2 else ROOF2,n=N*2)
    sc.ring_wall(CX,CY,sp['roof_r'],lan_top-0.05,lan_top,lambda *a:ROOF2,n=N*2)
    sc.sphere(CX,CY,roof_top+sp['fin_h']*0.5,sp['fin_r'],ROOF2)

# ===== 設計図（正面図・平面図、寸法つき） =====
def blueprint(path):
    K=110;M=60;FW=int(2*1.4*K)+M*2   # 1マス=110ドット
    fnt=None
    for f in ('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',):
        if os.path.exists(f): fnt=ImageFont.truetype(f,18);fs=ImageFont.truetype(f,22)
    if fnt is None: fnt=fs=ImageFont.load_default()
    LW=300;RW=230;PX0=M+LW+int(2.8*K)+RW   # 正面図の左の文字・右の文字のはば、平面図の左はし
    Wd=PX0+760;Hd=int(TOP*K)+M*3+40
    im=Image.new('RGB',(Wd,Hd),(240,244,250));d=ImageDraw.Draw(im)
    BL=(60,90,150);LT=(170,190,220)
    # --- 正面図（高さはそのまま、0.8倍しない）---
    ox=M+LW+int(1.4*K);gy=Hd-M-20   # まん中の x、地面の y
    X=lambda x:ox+x*K;Z=lambda z:gy-z*K
    for i in range(-2,3): d.line([(X(i*0.5),Z(0)),(X(i*0.5),Z(TOP))],fill=LT)
    for k in range(int(TOP*2)+1): d.line([(X(-1.3),Z(k*0.5)),(X(1.3),Z(k*0.5))],fill=LT)
    d.text((M,M//3),'正面図（高さはほんとうの高さ。1目もり=0.5マス）',font=fs,fill=BL)
    sp=S_
    def rect(x0,z0,x1,z1,fill): d.rectangle([X(x0),Z(z1),X(x1),Z(z0)],outline=BL,fill=fill,width=2)
    rect(-sp['base_r'],0,sp['base_r'],sp['base_h'],STONE)
    d.polygon([(X(-sp['tow_r0']),Z(sp['base_h'])),(X(sp['tow_r0']),Z(sp['base_h'])),(X(sp['tow_r1']),Z(sp['tow_h'])),(X(-sp['tow_r1']),Z(sp['tow_h']))],outline=BL,fill=WHITE,width=2)
    w,h=sp['door_w'],sp['door_h'];d.rectangle([X(-w/2),Z(sp['base_h']+h-w/2),X(w/2),Z(sp['base_h'])],fill=WOOD,outline=BL,width=2)
    d.pieslice([X(-w/2),Z(sp['base_h']+h),X(w/2),Z(sp['base_h']+h-w)],180,360,fill=WOOD,outline=BL,width=2)
    for z0 in sp['win_z']:
        w,h=sp['win_w'],sp['win_h'];d.rectangle([X(-w/2),Z(z0+h-w/2),X(w/2),Z(z0)],fill=(110,118,140),outline=BL)
        d.pieslice([X(-w/2),Z(z0+h),X(w/2),Z(z0+h-w)],180,360,fill=(110,118,140),outline=BL)
    rect(-sp['gal_r'],sp['gal_z'],sp['gal_r'],gal_top,STONE)
    rect(-sp['rail_r'],gal_top,sp['rail_r'],gal_top+sp['rail_h'],None)
    for i in range(N*2):
        a=2*math.pi*(i+0.5)/(N*2);x=sp['rail_r']*math.cos(a)
        if math.sin(a)>0: d.rectangle([X(x-0.045),Z(gal_top+sp['rail_h']),X(x+0.045),Z(gal_top)],fill=STONE,outline=BL)
    rect(-sp['lan_r'],gal_top,sp['lan_r'],lan_top,GLASS)
    d.polygon([(X(-sp['roof_r']),Z(lan_top)),(X(sp['roof_r']),Z(lan_top)),(X(0),Z(roof_top))],fill=ROOF,outline=BL,width=2)
    d.ellipse([X(-sp['fin_r']),Z(roof_top+sp['fin_h']),X(sp['fin_r']),Z(roof_top)],fill=ROOF2,outline=BL)
    # 高さの寸法（右がわ）
    for z,t in ((sp['base_h'],'土台 %.2f'),(sp['tow_h'],'塔 %.2f'),(gal_top,'見はらし台 %.2f'),(lan_top,'灯室 %.2f'),(roof_top,'屋根 %.2f'),(TOP,'てっぺん %.2f')):
        ty=min(Z(z)-11,last-24) if 'last' in dir() else Z(z)-11
        d.line([(X(0.3),Z(z)),(X(1.25),Z(z)),(X(1.33),ty+11)],fill=BL,width=1);d.text((X(1.38),ty),t%z,font=fnt,fill=BL);last=ty
    # はばの寸法（左がわに、半径）
    for z,r,t in ((sp['base_h']/2,sp['base_r'],'土台 はば %.2f'),(sp['base_h']+0.1,sp['tow_r0'],'塔の下 はば %.2f'),(sp['tow_h']-0.15,sp['tow_r1'],'塔の上 はば %.2f'),
                  (gal_top-0.05,sp['gal_r'],'見はらし台 はば %.2f'),(gal_top+sp['lan_h']/2,sp['lan_r'],'灯室 はば %.2f'),(lan_top+0.12,sp['roof_r'],'屋根 はば %.2f')):
        tw=d.textlength(t%(2*r),font=fnt);d.text((X(-1.38)-tw,Z(z)-11),t%(2*r),font=fnt,fill=BL);d.line([(X(-1.36),Z(z)),(X(-r),Z(z))],fill=LT,width=1)
    d.text((X(-0.84),Z(sp['base_h']+sp['door_h']/2)),'入口 %.2f×%.2f'%(sp['door_w'],sp['door_h']),font=fnt,fill=BL,anchor='rm')
    d.text((X(-0.78),Z(sp['win_z'][1]+sp['win_h']/2)),'小窓 %.2f×%.2f'%(sp['win_w'],sp['win_h']),font=fnt,fill=BL,anchor='rm')
    # --- 平面図（上から）---
    ox2=PX0+int(1.6*K);oy2=M+40+int(1.4*K)
    P=lambda x,y:(ox2+(x-CX)*K,oy2+(y-CY)*K)
    d.text((PX0,M//3),'平面図（上から。黄色いわく＝置く2×2マス）',font=fs,fill=BL)
    for i in range(0,3): d.line([P(i,-0.4),P(i,2.4)],fill=LT);d.line([P(-0.4,i),P(2.4,i)],fill=LT)
    d.rectangle([P(0,0),P(2,2)],outline=(214,170,70),width=3)
    def circ(r,fill,n=None):
        if n:d.polygon([P(CX+r*math.cos(2*math.pi*(i+0.5)/n),CY+r*math.sin(2*math.pi*(i+0.5)/n)) for i in range(n)],outline=BL,fill=fill,width=2)
        else:(x0,y0),(x1,y1)=P(CX-r,CY-r),P(CX+r,CY+r);d.ellipse([x0,y0,x1,y1],outline=BL,fill=fill,width=2)
    circ(sp['base_r'],STONE);circ(sp['tow_r0'],WHITE2);circ(sp['gal_r'],STONE);circ(sp['rail_r'],None,N);circ(sp['lan_r'],GLASS,N);circ(sp['roof_r'],ROOF,N*2)
    d.line([P(CX-0.25,CY+sp['tow_r0']),P(CX+0.25,CY+sp['tow_r0'])],fill=WOOD,width=6)
    d.text((ox2-60,oy2+int(1.15*K)),'↓ 正面（南）・入口',font=fnt,fill=BL)
    # 数字の一覧
    y=oy2+int(1.55*K);d.text((PX0,y),'寸法（マス）',font=fs,fill=BL);y+=32
    for t in ('土台：はば %.2f・高さ %.2f（石）'%(2*sp['base_r'],sp['base_h']),
              '塔：はば 下 %.2f→上 %.2f・高さ %.2f〜%.2f（白いしっくい）'%(2*sp['tow_r0'],2*sp['tow_r1'],sp['base_h'],sp['tow_h']),
              '入口：はば %.2f・高さ %.2f（アーチ、木のとびら、石のふち）'%(sp['door_w'],sp['door_h']),
              '小窓：2つ・はば %.2f・高さ %.2f・下のはし %.2f と %.2f'%(sp['win_w'],sp['win_h'],*sp['win_z']),
              '見はらし台：はば %.2f・床 %.2f〜%.2f（石）'%(2*sp['gal_r'],sp['gal_z'],gal_top),
              '手すり：はば %.2f・高さ %.2f（石の柱16本と横木）'%(2*sp['rail_r'],sp['rail_h']),
              '灯室：はば %.2f・高さ %.2f〜%.2f（八角形のガラス、赤い枠）'%(2*sp['lan_r'],gal_top,lan_top),
              '屋根：はば %.2f・高さ %.2f〜%.2f（赤い円すい）'%(2*sp['roof_r'],lan_top,roof_top),
              'てっぺんの玉：高さ %.2f まで'%TOP,
              'ゲームの見え方：はば %.2f・高さ %.2f マス'%(2*sp['base_r'],(CY+sp['base_r'])-(CY-0.8*TOP))):
        d.text((PX0,y),t,font=fnt,fill=BL);y+=26
    im.save(path)

out=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(__file__),'ref')
os.makedirs(out,exist_ok=True)
blueprint(f'{out}/plan.png')
sc=Scene();build(sc)
ext=(-1.0,3.0,-4.0,3.0)
fg=render(sc,game,ext,VIEW);bg=grid_bg(ext,(2,2));bg.alpha_composite(fg);bg.save(f'{out}/3d_full.png');fg.save(f'{out}/3d_full_nogrid.png')
sext=(-1.0,3.0,-6.0,0.5);sd=render(sc,side,sext,SIDE);bg=grid_bg(sext);bg.alpha_composite(sd);bg.save(f'{out}/3d_side.png')
print('ok')
