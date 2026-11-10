# 灯台（lighthouse、2×2マス）の設計図と3Dの下絵。
# 設計図の数字（SPEC）を1か所にまとめ、設計図の絵（plan.png）と3D（3d_full.png ほか）を、どちらもここから作る。
# 単位はマス。x=東, y=南, z=上。置くマスは左上が(0,0)、まん中は(1,1)。ゲームの見え方は 画面=(x, y-0.8z)。
# 大きさは、いまのチップ（見た目のはば約3.2マス・高さ約5.5マス）に合わせる。
# 建物として成り立つ作り（ほんものの灯台と同じ納まり）：
#   石の基礎 → 入口（基礎を切りこんだ2段の石段で上がる）→ 中はらせん階段（窓は階段にそって、ずれた高さ・向き）
#   → 塔のてっぺんに持ち送り（石の腕木）→ その上に見はらし台の床（塔より外へ張り出す）と鉄の手すり
#   → 当直室（見はらし台へ出る小さな戸）→ 灯室（下は石の腰、上はガラス。中にレンズ）→ 屋根 → 換気の玉 → 避雷針
# 出す絵（tools/art/lighthouse/ref/）：plan.png（設計図）、3d_full.png（ゲームの見え方・マス目と置くマスのわく）、3d_full_nogrid.png、3d_side.png（まよこ）
import math,sys,os
from PIL import Image,ImageDraw,ImageFont
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
CX,CY=1.0,1.0
N=8   # 灯室の面の数（八角形）

# ===== 設計図の数字（マス） =====
SPEC=dict(
    base_r=1.0,  base_h=0.25,                 # 基礎：石の丸い台（半径・高さ）。入口の前は2段の石段に切りこむ
    step_w=0.56,                              # 石段のはば（2段。1段の高さ＝基礎の高さの半分）
    tow_r0=0.78, tow_r1=0.52, tow_h=3.4,      # 塔：下の半径・上の半径・てっぺんの高さ（白いしっくい。上ほど細い）
    wall_t=0.12,                              # 塔のかべのあつさ（中は、らせん階段）
    door_w=0.42, door_h=0.72, door_f=0.06,    # 入口：はば・高さ（アーチ）・石のふちのはば
    win_w=0.14,  win_h=0.26,                  # 階段の窓：はば・高さ
    wins=((1.2,-0.22),(1.95,0.2),(2.7,-0.12)),# 窓の（下のはしの高さ・正面からの向き）。らせん階段にそって、高さと向きがずれる
    cor_n=16,    cor_h=0.28,                  # 持ち送り（石の腕木）：数・高さ（塔のてっぺんから下へ）
    gal_r=0.8,   gal_t=0.1,                   # 見はらし台の床：半径・あつさ（塔のてっぺんにのる）
    rail_r=0.76, rail_h=0.26, rail_n=16,      # 鉄の手すり：半径・高さ・柱の数（上の横木と、まん中の横木）
    wr_r=0.46,   wr_h=0.45,                   # 当直室：半径・高さ（見はらし台の床にのる）
    gd_w=0.18,   gd_h=0.36,                   # 見はらし台へ出る戸：はば・高さ
    lb_r=0.44,   lb_h=0.1,                    # 灯室の腰（石）：半径・高さ
    lan_r=0.42,  lan_h=0.6,                   # 灯室のガラス：半径・高さ（八角形、赤い枠）
    lens_r=0.17, lens_h=0.42,                 # 中のレンズ：半径・高さ
    roof_r=0.5,  roof_h=0.4,                  # 屋根：のきの半径・高さ（赤い、少しふくらんだ円すい）
    vent_r=0.07,                              # 換気の玉：半径
    rod_h=0.25,                               # 避雷針：玉の上の長さ
)
S_=SPEC
gal_z=S_['tow_h']; gal_top=gal_z+S_['gal_t']; wr_top=gal_top+S_['wr_h']; lb_top=wr_top+S_['lb_h']
lan_top=lb_top+S_['lan_h']; roof_top=lan_top+S_['roof_h']; vent_z=roof_top+S_['vent_r']; TOP=vent_z+S_['vent_r']+S_['rod_h']
def tow_r(z): return S_['tow_r0']+(S_['tow_r1']-S_['tow_r0'])*(z-S_['base_h'])/(S_['tow_h']-S_['base_h'])

STONE=(214,214,220);STONE2=(198,198,206);WHITE=(244,240,232);IRON=(150,160,178)
WOOD=(176,122,78);GLASS=(255,226,140);LENS=(255,244,200);FRAME=(206,92,74);ROOF=(222,104,84);ROOF2=(210,94,76);WIN=(110,118,140)

def arch(sc,a,z0,w,h,r,col):
    """塔のかべ（向き a、半径 r）に、下のはし z0・はば w・高さ h のアーチの形の板を、かべにそわせて貼る"""
    sc.part();ux,uy=-math.sin(a),math.cos(a);cx,cy=CX+r*math.cos(a),CY+r*math.sin(a)
    P=lambda s,z:(cx+ux*s,cy+uy*s,z);zr=z0+h-w/2
    sc.quad(P(-w/2,z0),P(w/2,z0),P(w/2,zr),P(-w/2,zr),col)
    for i in range(12):
        t0=math.pi*i/12;t1=math.pi*(i+1)/12
        sc.tri(P(0,zr),P(w/2*math.cos(t0),zr+w/2*math.sin(t0)),P(w/2*math.cos(t1),zr+w/2*math.sin(t1)),col)

def build(sc):
    sp=S_;F=math.pi/2   # 正面（南）の向き
    # 基礎（入口の前だけ切りこむ）
    n=48;sc.part()
    for i in range(n):
        a0=2*math.pi*i/n;a1=2*math.pi*(i+1)/n;am=(a0+a1)/2
        cut=abs(sp['base_r']*math.cos(am))<sp['step_w']/2 and math.sin(am)>0
        if cut: continue
        p=lambda a,r,z:(CX+r*math.cos(a),CY+r*math.sin(a),z)
        sc.quad(p(a0,sp['base_r'],0),p(a1,sp['base_r'],0),p(a1,sp['base_r'],sp['base_h']),p(a0,sp['base_r'],sp['base_h']),STONE2 if i%2 else STONE)
        sc.quad(p(a0,0,sp['base_h']),p(a0,sp['base_r'],sp['base_h']),p(a1,sp['base_r'],sp['base_h']),p(a1,0,sp['base_h']),STONE)
    # 石段（2段）：塔のかべから基礎のふちまで
    w=sp['step_w'];y0=CY+sp['tow_r0']-0.04;y2=CY+math.sqrt(sp['base_r']**2-(w/2)**2);ym=(y0+y2)/2;h=sp['base_h']
    sc.box(CX-w/2,CY,0,CX+w/2,ym,h,STONE,bevel=0.01);sc.box(CX-w/2,ym,0,CX+w/2,y2,h/2,STONE2,bevel=0.01)
    # 塔
    sc.revolve(CX,CY,[(sp['tow_r1'],sp['tow_h']),(sp['tow_r0'],sp['base_h'])],lambda k,i:WHITE,n=48)
    # 入口：石のふち・木のとびら
    arch(sc,F,sp['base_h'],sp['door_w']+2*sp['door_f'],sp['door_h']+sp['door_f'],tow_r(sp['base_h'])+0.012,STONE2)
    arch(sc,F,sp['base_h'],sp['door_w'],sp['door_h'],tow_r(sp['base_h'])+0.022,WOOD)
    # 階段の窓（らせんにそって、ずれる）
    for z0,da in sp['wins']:
        arch(sc,F+da,z0-0.03,sp['win_w']+0.06,sp['win_h']+0.06,tow_r(z0)+0.012,STONE2)
        arch(sc,F+da,z0,sp['win_w'],sp['win_h'],tow_r(z0)+0.02,WIN)
    # 持ち送り：塔のてっぺんから、見はらし台の床の下へ（下ほど塔によった、石の腕木）
    for i in range(sp['cor_n']):
        a=2*math.pi*(i+0.5)/sp['cor_n'];c,s=math.cos(a),math.sin(a)
        for k in range(4):   # 下から上へ、だんだん外へ出る
            z0=gal_z-sp['cor_h']*(1-k/4);z1=gal_z-sp['cor_h']*(1-(k+1)/4)
            r0=tow_r(z0)-0.02;r1=tow_r(z1)+(sp['gal_r']-0.03-tow_r(z1))*((k+1)/4)
            hw=0.05;ux,uy=-s,c
            pts=lambda r,z:[(CX+r*c+ux*e,CY+r*s+uy*e,z) for e in (-hw,hw)]
            (a0,b0),(a1,b1)=pts(r0,z0),pts(r1,z0);(a2,b2),(a3,b3)=pts(r0,z1),pts(r1,z1)
            sc.part();sc.quad(a1,b1,b3,a3,STONE2);sc.quad(a0,a1,a3,a2,STONE2);sc.quad(b0,b1,b3,b2,STONE2);sc.quad(a2,a3,b3,b2,STONE2);sc.quad(a0,b0,b1,a1,STONE2)
    # 見はらし台の床
    sc.ring_wall(CX,CY,sp['gal_r'],gal_z,gal_top,lambda *a:STONE2,n=48);sc.annulus(CX,CY,0,sp['gal_r'],gal_top,lambda *a:STONE,n=48)
    # 鉄の手すり：柱と、上・まん中の横木
    for i in range(sp['rail_n']):
        a=2*math.pi*(i+0.5)/sp['rail_n'];x,y=CX+sp['rail_r']*math.cos(a),CY+sp['rail_r']*math.sin(a)
        sc.box(x-0.018,y-0.018,gal_top,x+0.018,y+0.018,gal_top+sp['rail_h'],IRON,bevel=0.004)
    for zz in (sp['rail_h'],sp['rail_h']*0.5):
        pts=[(CX+sp['rail_r']*math.cos(2*math.pi*i/48),CY+sp['rail_r']*math.sin(2*math.pi*i/48),gal_top+zz-0.012) for i in range(49)]
        sc.tube(pts,0.014,IRON,n=6)
    # 当直室と、見はらし台へ出る戸
    sc.ring_wall(CX,CY,sp['wr_r'],gal_top,wr_top,lambda *a:WHITE,n=40);sc.annulus(CX,CY,0,sp['wr_r'],wr_top,lambda *a:STONE,n=40)
    arch(sc,F,gal_top,sp['gd_w'],sp['gd_h'],sp['wr_r']+0.01,WOOD)
    # 灯室：石の腰・ガラスと赤い枠・中のレンズ
    sc.ring_wall(CX,CY,sp['lb_r'],wr_top,lb_top,lambda *a:STONE2,n=N);sc.annulus(CX,CY,0,sp['lb_r'],lb_top,lambda *a:STONE,n=N)
    sc.ring_wall(CX,CY,sp['lens_r'],lb_top,lb_top+sp['lens_h'],lambda *a:LENS,n=16)
    for i in range(N):
        a0=2*math.pi*(i+0.5)/N;a1=2*math.pi*(i+1.5)/N;r=sp['lan_r']
        p=lambda a,z:(CX+r*math.cos(a),CY+r*math.sin(a),z);sc.part()
        sc.quad(p(a0,lb_top),p(a1,lb_top),p(a1,lan_top),p(a0,lan_top),GLASS)
        x,y=p(a0,0)[:2];sc.box(x-0.022,y-0.022,lb_top,x+0.022,y+0.022,lan_top,FRAME,bevel=0.005)
    for zz in (lb_top+sp['lan_h']*0.5,lan_top-0.02):   # まん中と上の横の枠（ガラスの八角形にそう）
        for i in range(N):
            a0=2*math.pi*(i+0.5)/N;a1=2*math.pi*(i+1.5)/N;r=sp['lan_r']+0.012
            sc.beam((CX+r*math.cos(a0),CY+r*math.sin(a0),zz),(CX+r*math.cos(a1),CY+r*math.sin(a1),zz),0.017,FRAME)
    # 屋根（少しふくらんだ円すい）・換気の玉・避雷針
    prof=[(sp['roof_r']*(1-t)**0.8,lan_top+sp['roof_h']*t) for t in (1.0,0.75,0.5,0.25,0.0)]
    sc.revolve(CX,CY,prof,lambda k,i:ROOF if i%2 else ROOF2,n=N*2)
    sc.ring_wall(CX,CY,sp['roof_r'],lan_top-0.04,lan_top,lambda *a:ROOF2,n=N*2)
    sc.sphere(CX,CY,vent_z,sp['vent_r'],ROOF2)
    sc.tube([(CX,CY,vent_z+sp['vent_r']*0.8),(CX,CY,TOP)],0.012,IRON,n=6)

# ===== 設計図（正面図・平面図、寸法つき） =====
def blueprint(path):
    K=110;M=60
    fnt=fs=None
    for f in ('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',):
        if os.path.exists(f): fnt=ImageFont.truetype(f,18);fs=ImageFont.truetype(f,22)
    if fnt is None: fnt=fs=ImageFont.load_default()
    LW=300;RW=250;PX0=M+LW+int(2.8*K)+RW
    Wd=PX0+900;Hd=int(TOP*K)+M*3+40
    im=Image.new('RGB',(Wd,Hd),(240,244,250));d=ImageDraw.Draw(im)
    BL=(60,90,150);LT=(170,190,220);DS=(120,140,190)
    ox=M+LW+int(1.4*K);gy=Hd-M-20
    X=lambda x:ox+x*K;Z=lambda z:gy-z*K
    for i in range(-2,3): d.line([(X(i*0.5),Z(0)),(X(i*0.5),Z(TOP))],fill=LT)
    for k in range(int(TOP*2)+1): d.line([(X(-1.3),Z(k*0.5)),(X(1.3),Z(k*0.5))],fill=LT)
    d.text((M,M//3),'正面図（高さはほんとうの高さ。1目もり=0.5マス。点線は中）',font=fs,fill=BL)
    sp=S_
    def rect(x0,z0,x1,z1,fill,o=BL): d.rectangle([X(x0),Z(z1),X(x1),Z(z0)],outline=o,fill=fill,width=2)
    def dash(p0,p1):
        (x0,y0),(x1,y1)=p0,p1;L=math.hypot(x1-x0,y1-y0);n=max(1,int(L/8))
        for i in range(0,n,2): d.line([(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n),(x0+(x1-x0)*(i+1)/n,y0+(y1-y0)*(i+1)/n)],fill=DS,width=2)
    def archf(xc,z0,w,h,fill):
        d.rectangle([X(xc-w/2),Z(z0+h-w/2),X(xc+w/2),Z(z0)],fill=fill,outline=BL);d.pieslice([X(xc-w/2),Z(z0+h),X(xc+w/2),Z(z0+h-w)],180,360,fill=fill,outline=BL)
    # 基礎と石段
    rect(-sp['base_r'],0,sp['base_r'],sp['base_h'],STONE)
    rect(-sp['step_w']/2,0,sp['step_w']/2,sp['base_h']/2,STONE2);rect(-sp['step_w']/2,sp['base_h']/2,sp['step_w']/2,sp['base_h'],STONE)
    # 塔
    d.polygon([(X(-sp['tow_r0']),Z(sp['base_h'])),(X(sp['tow_r0']),Z(sp['base_h'])),(X(sp['tow_r1']),Z(sp['tow_h'])),(X(-sp['tow_r1']),Z(sp['tow_h']))],outline=BL,fill=WHITE,width=2)
    t=sp['wall_t'];dash((X(-sp['tow_r0']+t),Z(sp['base_h'])),(X(-sp['tow_r1']+t),Z(sp['tow_h'])));dash((X(sp['tow_r0']-t),Z(sp['base_h'])),(X(sp['tow_r1']-t),Z(sp['tow_h'])))
    # らせん階段（点線のジグザグ）
    zz=sp['base_h']+0.1;side=1
    while zz<sp['tow_h']-0.4:
        r=tow_r(zz)-t-0.02;dash((X(-side*r),Z(zz)),(X(side*r),Z(zz+0.38)));zz+=0.38;side=-side
    archf(0,sp['base_h'],sp['door_w']+2*sp['door_f'],sp['door_h']+sp['door_f'],STONE2);archf(0,sp['base_h'],sp['door_w'],sp['door_h'],WOOD)
    for z0,da in sp['wins']:
        xc=tow_r(z0)*math.sin(-da);archf(xc,z0,sp['win_w'],sp['win_h'],WIN)
    # 持ち送り
    for i in range(sp['cor_n']):
        a=2*math.pi*(i+0.5)/sp['cor_n']
        if math.sin(a)<=0: continue
        x0=tow_r(gal_z)*math.cos(a);x1=(sp['gal_r']-0.03)*math.cos(a)
        d.polygon([(X(x0-0.05),Z(gal_z-sp['cor_h'])),(X(x0+0.05),Z(gal_z-sp['cor_h'])),(X(x1+0.05),Z(gal_z)),(X(x1-0.05),Z(gal_z))],fill=STONE2,outline=BL)
    rect(-sp['gal_r'],gal_z,sp['gal_r'],gal_top,STONE)
    # 手すり
    for i in range(sp['rail_n']):
        a=2*math.pi*(i+0.5)/sp['rail_n']
        if math.sin(a)>0: x=sp['rail_r']*math.cos(a);d.line([(X(x),Z(gal_top)),(X(x),Z(gal_top+sp['rail_h']))],fill=IRON,width=3)
    for zz in (sp['rail_h'],sp['rail_h']*0.5): d.line([(X(-sp['rail_r']),Z(gal_top+zz)),(X(sp['rail_r']),Z(gal_top+zz))],fill=IRON,width=3)
    rect(-sp['wr_r'],gal_top,sp['wr_r'],wr_top,WHITE);archf(0,gal_top,sp['gd_w'],sp['gd_h'],WOOD)
    rect(-sp['lb_r'],wr_top,sp['lb_r'],lb_top,STONE2)
    rect(-sp['lan_r'],lb_top,sp['lan_r'],lan_top,GLASS)
    for xx in (-sp['lan_r'],-sp['lan_r']*0.38,sp['lan_r']*0.38,sp['lan_r']): d.line([(X(xx),Z(lb_top)),(X(xx),Z(lan_top))],fill=FRAME,width=3)
    d.line([(X(-sp['lan_r']),Z(lb_top+sp['lan_h']/2)),(X(sp['lan_r']),Z(lb_top+sp['lan_h']/2))],fill=FRAME,width=3)
    rect(-sp['lens_r'],lb_top,sp['lens_r'],lb_top+sp['lens_h'],None,DS)
    ts=(0.25,0.5,0.75,1.0)
    d.polygon([(X(-sp['roof_r']),Z(lan_top)),(X(sp['roof_r']),Z(lan_top))]+[(X(sp['roof_r']*(1-t)**0.8),Z(lan_top+sp['roof_h']*t)) for t in ts]+[(X(-sp['roof_r']*(1-t)**0.8),Z(lan_top+sp['roof_h']*t)) for t in ts[::-1][1:]],fill=ROOF,outline=BL)
    d.ellipse([X(-sp['vent_r']),Z(vent_z+sp['vent_r']),X(sp['vent_r']),Z(vent_z-sp['vent_r'])],fill=ROOF2,outline=BL)
    d.line([(X(0),Z(vent_z+sp['vent_r'])),(X(0),Z(TOP))],fill=IRON,width=3)
    # 高さの寸法（右）
    last=10**9
    for z,tx in ((sp['base_h'],'基礎 %.2f'),(gal_z-sp['cor_h'],'持ち送り %.2f'),(gal_z,'塔のてっぺん %.2f'),(gal_top,'見はらし台の床 %.2f'),(wr_top,'当直室 %.2f'),(lb_top,'灯室の腰 %.2f'),(lan_top,'灯室 %.2f'),(roof_top,'屋根 %.2f'),(TOP,'避雷針 %.2f')):
        ty=min(Z(z)-11,last-24);d.line([(X(0.3),Z(z)),(X(1.25),Z(z)),(X(1.33),ty+11)],fill=BL,width=1);d.text((X(1.38),ty),tx%z,font=fnt,fill=BL);last=ty
    # はばの寸法（左）
    last=-10**9
    for z,r,tx in ((lan_top+0.1,sp['roof_r'],'屋根 はば %.2f'),(lb_top+sp['lan_h']*0.7,sp['lan_r'],'灯室 はば %.2f'),(wr_top-0.15,sp['wr_r'],'当直室 はば %.2f'),(gal_top+sp['rail_h'],sp['rail_r'],'手すり はば %.2f'),
                   (gal_z+0.05,sp['gal_r'],'見はらし台 はば %.2f'),(gal_z-0.2,sp['tow_r1'],'塔の上 はば %.2f'),(2.3,tow_r(2.3),'窓 %.2f×%.2f'%(sp['win_w'],sp['win_h'])),
                   (sp['base_h']+0.5,tow_r(0.75),'入口 %.2f×%.2f'%(sp['door_w'],sp['door_h'])),(sp['base_h']+0.08,sp['tow_r0'],'塔の下 はば %.2f'),(sp['base_h']/2,sp['base_r'],'基礎 はば %.2f')):
        s=tx%(2*r) if '%' in tx else tx;ty=max(Z(z)-11,last+24);tw=d.textlength(s,font=fnt)
        d.text((X(-1.38)-tw,ty),s,font=fnt,fill=BL);d.line([(X(-1.36),ty+11),(X(-1.28),Z(z)),(X(-r),Z(z))],fill=LT,width=1);last=ty
    # --- 平面図（上から）---
    ox2=PX0+int(1.6*K);oy2=M+40+int(1.4*K)
    P=lambda x,y:(ox2+(x-CX)*K,oy2+(y-CY)*K)
    d.text((PX0,M//3),'平面図（上から。黄色いわく＝置く2×2マス）',font=fs,fill=BL)
    for i in range(0,3): d.line([P(i,-0.4),P(i,2.4)],fill=LT);d.line([P(-0.4,i),P(2.4,i)],fill=LT)
    d.rectangle([P(0,0),P(2,2)],outline=(214,170,70),width=3)
    def circ(r,fill,n=None,o=BL):
        if n:d.polygon([P(CX+r*math.cos(2*math.pi*(i+0.5)/n),CY+r*math.sin(2*math.pi*(i+0.5)/n)) for i in range(n)],outline=o,fill=fill,width=2)
        else:(x0,y0),(x1,y1)=P(CX-r,CY-r),P(CX+r,CY+r);d.ellipse([x0,y0,x1,y1],outline=o,fill=fill,width=2)
    circ(sp['base_r'],STONE);circ(sp['gal_r'],STONE);circ(sp['rail_r'],None,o=IRON)
    circ(sp['wr_r'],WHITE);circ(sp['roof_r'],ROOF,N*2)
    w=sp['step_w'];d.rectangle([P(CX-w/2,CY+sp['gal_r']),P(CX+w/2,CY+sp['base_r'])],fill=STONE2,outline=BL)
    d.text((ox2-110,oy2+int(1.15*K)),'↓ 正面（南）・入口と石段',font=fnt,fill=BL)
    # 1階の中（右の小さな図）：かべのあつさと、らせん階段
    ox3=ox2+int(2.4*K);P3=lambda x,y:(ox3+x*K*0.8,oy2+y*K*0.8)
    r0,ri=sp['tow_r0'],sp['tow_r0']-sp['wall_t']
    d.ellipse([P3(-r0,-r0),P3(r0,r0)],fill=WHITE,outline=BL,width=2);d.ellipse([P3(-ri,-ri),P3(ri,ri)],fill=(250,250,252),outline=BL,width=1)
    for i in range(12):
        a=2*math.pi*i/12;d.line([P3(0.08*math.cos(a),0.08*math.sin(a)),P3(ri*math.cos(a),ri*math.sin(a))],fill=DS,width=1)
    d.ellipse([P3(-0.08,-0.08),P3(0.08,0.08)],fill=STONE,outline=BL)
    d.rectangle([P3(-sp['door_w']/2,ri),P3(sp['door_w']/2,r0)],fill=WOOD)
    d.text((ox3-80,oy2+int(0.8*K)),'塔の中（らせん階段）',font=fnt,fill=BL)
    # 数字の一覧
    y=oy2+int(1.55*K);d.text((PX0,y),'寸法（マス）と、のりかた',font=fs,fill=BL);y+=32
    for tx in ('基礎：はば %.2f・高さ %.2f（石）。入口の前を2段の石段に切りこむ（はば %.2f）'%(2*sp['base_r'],sp['base_h'],sp['step_w']),
              '塔：基礎にのる。はば 下 %.2f→上 %.2f・高さ %.2f〜%.2f・かべのあつさ %.2f（白いしっくい）'%(2*sp['tow_r0'],2*sp['tow_r1'],sp['base_h'],gal_z,sp['wall_t']),
              '　中は、まん中の柱をまわる、らせん階段。窓3つは階段にそって、高さと向きがずれる',
              '入口：はば %.2f・高さ %.2f（アーチ・木のとびら・石のふち %.2f）'%(sp['door_w'],sp['door_h'],sp['door_f']),
              '窓：はば %.2f・高さ %.2f・下のはし %s'%(sp['win_w'],sp['win_h'],'・'.join('%.2f'%w[0] for w in sp['wins'])),
              '持ち送り：石の腕木 %d本・高さ %.2f。塔から外へ張り出して、見はらし台の床をささえる'%(sp['cor_n'],sp['cor_h']),
              '見はらし台：塔のてっぺんと持ち送りにのる。はば %.2f・床 %.2f〜%.2f（石）'%(2*sp['gal_r'],gal_z,gal_top),
              '手すり：床にのる。はば %.2f・高さ %.2f（鉄の柱%d本と、上・まん中の横木）'%(2*sp['rail_r'],sp['rail_h'],sp['rail_n']),
              '当直室：床にのる。はば %.2f・高さ %.2f〜%.2f。見はらし台へ出る戸 %.2f×%.2f'%(2*sp['wr_r'],gal_top,wr_top,sp['gd_w'],sp['gd_h']),
              '灯室：当直室にのる。石の腰 %.2f〜%.2f、ガラス %.2f〜%.2f（八角形・赤い枠）。中にレンズ'%(wr_top,lb_top,lb_top,lan_top),
              '屋根：灯室にのる。はば %.2f・高さ %.2f〜%.2f（赤）。換気の玉と避雷針（%.2f まで）'%(2*sp['roof_r'],lan_top,roof_top,TOP),
              'ゲームの見え方：はば %.2f・高さ %.2f マス'%(2*sp['base_r'],(CY+sp['base_r'])-(CY-0.8*TOP))):
        d.text((PX0,y),tx,font=fnt,fill=BL);y+=26
    im.save(path)

out=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(__file__),'ref')
os.makedirs(out,exist_ok=True)
blueprint(f'{out}/plan.png')
sc=Scene();build(sc)
ext=(-1.0,3.0,-4.0,3.0)
fg=render(sc,game,ext,VIEW);bg=grid_bg(ext,(2,2));bg.alpha_composite(fg);bg.save(f'{out}/3d_full.png');fg.save(f'{out}/3d_full_nogrid.png')
sext=(-1.0,3.0,-6.0,0.5);sd=render(sc,side,sext,SIDE);bg=grid_bg(sext);bg.alpha_composite(sd);bg.save(f'{out}/3d_side.png')
print('ok')
