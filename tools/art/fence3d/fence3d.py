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
# ロープの手すり（風）：scene_rope のはじめの行。
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
BAM=(202,194,134);BAMP=(186,176,116);CRM=(240,214,164);CRMP=(222,192,136);ST=(222,212,198);STC=(236,228,216)
def tube(nm,a,b,r,col,det=12):return Part(nm,'frust',(a,b,r,r),col,detail=det)
def vsegs(m,PCY,back,front,full=(-EXT,1.0)):
    """たての部品の、マスの中のはんい（上のマスへのばす所 -EXT〜0 もふくむ）"""
    if m==12:return [full]
    L=[]
    if m&4:L.append((-EXT,back))
    if m&8:L.append((front,1.0))
    return L
def addv(P,kind,mk,y0,y1,col,org=(0,0)):
    """たての部品を、上のマスへのばした所（ext）と、マスの中の所にわけて足す。mk(y0,y1)→Part"""
    if y0<0:P.append(('ext',mk(y0,0.0),org));y0=0.0
    if y1>y0:P.append((kind,mk(y0,y1),org))
def scene_bamboo(m):   # 竹の柵（四つ目垣）：親柱・立子（たて）・胴縁（よこ）
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];YC=0.86;PC=(0.5,YC)
    for cx in(0,0.25,0.5,0.75,1.0):   # 立子
        if (cx<0.5 and L) or (cx>0.5 and R) or (cx==0.5 and m==3):P.append(('bam',tube('立子',(cx,YC,0),(cx,YC,0.70),0.026,BAM),None))
    for cy in(0.125,0.375,0.625,0.875):
        if post and abs(cy-YC)<0.15:continue
        if m==12 or (cy<YC and U) or (cy>YC and D):P.append(('bam',tube('立子',(0.5,cy,0),(0.5,cy,0.70),0.026,BAM),None))
    if post:
        P.append(('bam',tube('親柱',(0.5,YC,0),(0.5,YC,0.80),0.055,BAMP,16),None))
        for z in(0.28,0.56):P.append(('bam',tube('ふし',(0.5,YC,z),(0.5,YC,z+0.02),0.06,BAMP,16),None))
    for z in(0.24,0.52):
        if L or R:
            x0=-0.4 if L else 0.5;x1=1.4 if R else 0.5
            P.append(('bam',tube('胴縁',(x0,YC+0.05,z),(x1,YC+0.05,z),0.03,BAM),None))
        for y0,y1 in vsegs(m,YC,YC-0.06,YC+0.06):
            g='bv%d'%(z*100)
            addv(P,'bamv',lambda a,b,z=z,g=g:Part('胴縁','frust',((0.55,a,z),(0.55,b,z),0.03,0.03),BAM,detail=12,grp=g),y0,y1,BAM)
    return P
def scene_misugaki(m):   # 御簾垣：親柱・細い竹を横につんだ面（御簾）・押縁（たて）・玉縁（上）
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];YC=0.90;H=0.98;NS=22
    def slats_h(x0,x1):
        for k in range(NS):
            z=0.04+k*(H-0.08)/(NS-1);P.append(('crm',Part('御簾','frust',((x0,YC,z),(x1,YC,z),0.024,0.024),CRM,detail=8,grp='mh'),None))
        P.append(('crm',tube('玉縁',(x0,YC,H),(x1,YC,H),0.04,CRMP),None))
        for bx in(0,0.25,0.5,0.75,1.0):
            if x0<=bx<=x1 and not(post and bx==0.5):P.append(('crm',Part('押縁','box',(bx-0.02,YC+0.024,0.02,bx+0.02,YC+0.05,H-0.02),CRMP),None))
    if L or R:slats_h(-0.4 if L else 0.5,1.4 if R else 0.5)
    for y0,y1 in vsegs(m,YC,YC-0.06,YC+0.06):
        for k in range(NS):
            z=0.04+k*(H-0.08)/(NS-1)
            addv(P,'crmv',lambda a,b,z=z:Part('御簾','frust',((0.5,a,z),(0.5,b,z),0.024,0.024),CRM,detail=8,grp='mv'),y0,y1,CRM)
        addv(P,'crmv',lambda a,b:Part('玉縁','frust',((0.5,a,H),(0.5,b,H),0.04,0.04),CRMP,detail=12,grp='tv'),y0,y1,CRMP)
        for by in(0.25,0.75):
            if y0<=by-0.02 and by+0.02<=y1:P.append(('crm',Part('押縁','box',(0.524,by-0.02,0.02,0.55,by+0.02,H-0.02),CRMP),None))
    if post:
        P.append(('crm',tube('親柱',(0.5,YC,0),(0.5,YC,H+0.08),0.06,CRMP,16),None))
        for z in(0.35,0.7):P.append(('crm',tube('ふし',(0.5,YC,z),(0.5,YC,z+0.02),0.066,CRMP,16),None))
    return P
def scene_wall(m):   # 石の塀（石垣）：おなじ大きさの石を、だんごとに半分ずらしてつむ。上にかさ石。角・はし・まじわる所に石の柱
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];Y0,Y1=0.64,0.98;X0,X1=0.33,0.67;CH=0.283;NC=3;ZT=CH*NC
    def stone(nm,b,col,org):P.append(('stone',Part(nm,'box',b,col),org))
    if L or R:
        spans=[(-0.4,1.4)] if not post else [q for q,c_ in(((-0.4,0.29),L),((0.71,1.4),R)) if c_]   # 柱があれば、柱の横の面まで
        for xa,xb in spans:
          for c in range(NC):
              off=0.125 if c%2==0 else 0.375
              for k in range(-3,5):
                  a=off+k*0.5;b=a+0.5;a,b=max(a,xa),min(b,xb)
                  if b-a>0.01:stone('石',(a,Y0,c*CH,b,Y1,(c+1)*CH),ST,((a%1),c))
          for k in range(-2,4):
              a=0.25+k*0.5;b=a+0.5;a,b=max(a,xa),min(b,xb)
              if b-a>0.01:stone('かさ石',(a,Y0-0.02,ZT,b,Y1+0.02,ZT+0.1),STC,((a%1),9))
    for y0,y1 in vsegs(m,0.8,0.6,1.0,(0.0,1.0)):
        y0=max(0.0,y0);ga=0.016 if y0==0 else 0.0
        for c in range(NC):
            for k in range(-1,3):
                a=k*0.5+(0.25 if c%2 else 0);b=a+0.5;a,b=max(a,y0+ga),min(b,y1)
                if b-a>0.01:stone('石',(X0,a,c*CH,X1,b,(c+1)*CH),ST,(0,(a%1)+c))
        for a,b in((0,0.5),(0.5,1.0)):
            a,b=max(a,y0+ga),min(b,y1)
            if b-a>0.01:stone('かさ石',(X0-0.02,a,ZT,X1+0.02,b,ZT+0.1),STC,(0,(a%1)+9))
    if post:
        for c in range(3):stone('柱の石',(0.29,0.6,c*0.32,0.71,1.0,(c+1)*0.32),ST,(0.5,20+c))
        stone('柱のかさ',(0.26,0.57,0.96,0.74,1.0,1.08),STC,(0.5,30))
    return P
PARKW=(252,250,244);PARKB=(176,212,230)   # 遊園地の白い塀：白い板・水色（柱の玉・横木の帯）
def scene_park(m):   # 遊園地の白い塀（風）：板の柵と同じ線に、白い板（はば0.24・高さ0.9、上はまるい）をすきまなくならべる。柱は0.18角・高さ1.02、上に水色の玉。前に水色の横木の帯
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];Y0,Y1=0.885,0.945;PC=(0.5,0.865);w=0.118
    top=lambda c:[(c-w,0),(c+w,0),(c+w,0.82),(c+w*0.6,0.885),(c,0.905),(c-w*0.6,0.885),(c-w,0.82)]
    for cx in(0,0.25,0.5,0.75,1.0):
        if cx<0.5 and not L or cx>0.5 and not R or cx==0.5 and (post or not(L or R)):continue
        P.append(('picket',Part('板','prism',(top(cx),Y0,Y1),PARKW),(cx%1,0)))
    for cy in(0.125,0.375,0.625,0.875):
        if post and abs(cy-PC[1])<0.17:continue
        if m==12 or (cy<PC[1] and U) or (cy>PC[1] and D):P.append(('picket',Part('板','prism',(top(cy),0.45,0.51,'x'),PARKW),(0,cy%1)))
    if post:
        P.append(('post',Part('柱','box',(0.41,0.775,0,0.59,0.955,1.02),PARKW),None))
        P.append(('cap',Part('柱の玉','ball',(0.5,0.865,1.08,0.08,1.0),PARKB),None))
    for z0,z1,col in((0.56,0.65,PARKB),(0.12,0.2,PARKW)):
        if L or R:
            x0=-0.4 if L else 0.41;x1=1.4 if R else 0.59
            P.append(('railh',Part('横木','box',(x0,0.945,z0,x1,0.985,z1),col),(0,0)))
        for y0,y1 in vsegs(m,PC[1],0.775,0.985 if (L or R) else 0.955):
            addv(P,'railv',lambda a,b,z0=z0,z1=z1,col=col:Part('横木','box',(0.51,a,z0,0.55,b,z1),col,grp='pv%d'%(z0*100)),y0,y1,col)
    return P
ACAC=(222,170,108);ROPE=(226,206,152);ROPED=(204,182,126)   # ロープの手すり（風）：アカシアの木・なびき草をよったロープ
def scene_rope(m):   # ロープの手すり（風）：柱は角・はしだけ（アカシアの丸い柱、半径0.075・高さ0.8、ロープを2かい巻く）。そのあいだは、ロープ2本（高さ0.62・0.34、太さ0.026）と、マスのさかいの細いくい（半径0.045・高さ0.7。たては1マスに1本）
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];YC=0.865;PC=(0.5,YC)
    for cx in(0.0,1.0):
        if (cx<0.5 and L) or (cx>0.5 and R):P.append(('post',Part('くい','cyl',(cx,YC,0.045,0,0.7),ACAC),(cx%1,0)))
    if m==3:P.append(('post',Part('くい','cyl',(0.5,YC,0.045,0,0.7),ACAC),(0.5,0)))
    if m==12 or U and not post:P.append(('post',Part('くい','cyl',(0.5,0.375,0.045,0,0.7),ACAC),(0,0.375)))
    if post:
        P.append(('post',Part('柱','cyl',(0.5,YC,0.075,0,0.8),ACAC),(0,0)))
        for z in(0.62,0.34):P.append(('rope',Part('巻いたロープ','cyl',(0.5,YC,0.085,z-0.035,z+0.035),ROPED),None))
    for z in(0.62,0.34):
        if L or R:
            x0=-0.4 if L else 0.5;x1=1.4 if R else 0.5
            P.append(('rope',tube('ロープ',(x0,YC+0.05,z),(x1,YC+0.05,z),0.026,ROPE),None))
        for y0,y1 in vsegs(m,YC,YC-0.06,YC+0.06):
            g='rv%d'%(z*100)
            addv(P,'ropev',lambda a,b,z=z,g=g:Part('ロープ','frust',((0.55,a,z),(0.55,b,z),0.026,0.026),ROPE,detail=12,grp=g),y0,y1,ROPE)
    return P
REED=(238,224,172);REEDG=(214,220,160);BIND=(170,140,96);RPOST=(150,108,78)   # あしの垣（水）
def scene_ashi(m):   # あしの垣（水）：あしのくき（半径0.036・高さ0.80〜0.88）を1マスに12本、すきまなくならべ、高さ0.24・0.60に、しばるなわ。柱は角・はしだけ（木の丸い柱、半径0.07・高さ0.95）
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];YC=0.865
    for k in range(12):
        c=(k+0.5)/12;h=0.80+0.08*((k*7)%5)/4;col=REED if k%3 else REEDG
        if post and abs(c-0.5)<0.09:continue
        if (c<0.5 and L) or (c>0.5 and R) or m==3:P.append(('reed',Part('あし','cyl',(c,YC,0.036,0,h),col,detail=8),None))
        if m==12 or (c<YC and U) or (c>YC and D) and not(post and abs(c-YC)<0.09):
            if not(post and abs(c-YC)<0.09):P.append(('reed',Part('あし','cyl',(0.5,c,0.036,0,h),col,detail=8),None))
    if post:P.append(('post',Part('柱','cyl',(0.5,YC,0.07,0,0.95),RPOST),(0,0)))
    for z in(0.24,0.60):
        if L or R:
            x0=-0.4 if L else 0.5;x1=1.4 if R else 0.5
            P.append(('rope',tube('なわ',(x0,YC+0.035,z),(x1,YC+0.035,z),0.02,BIND),None))
        for y0,y1 in vsegs(m,YC,YC-0.06,YC+0.06):
            g='av%d'%(z*100)
            addv(P,'ropev',lambda a,b,z=z,g=g:Part('なわ','frust',((0.535,a,z),(0.535,b,z),0.02,0.02),BIND,detail=10,grp=g),y0,y1,BIND)
    return P
RSTN=(214,218,222);RSTND=(196,202,208)   # 運河の石の欄干（水）
def scene_rankan(m):   # 運河の石の欄干（水）：石の台（高さ0〜0.10）と上の手すり（高さ0.58〜0.70）のあいだに、つぼの形の小さな柱（1マスに4本）。柱は角・はしだけ（0.22角・高さ0.86、かさ石）
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];YC=0.865
    vase=lambda cx,cy:Part('小柱','lathe',(cx,cy,[(0.0,0.10),(0.04,0.10),(0.035,0.16),(0.055,0.30),(0.03,0.46),(0.04,0.52),(0.045,0.58),(0.0,0.58)]),RSTND,detail=12)
    for k in range(4):
        c=(k+0.5)/4
        if post and abs(c-0.5)<0.2:continue
        if (c<0.5 and L) or (c>0.5 and R) or m==3:P.append(('stone',vase(c,YC),(c,0)))
        if (m==12 or (c<YC and U) or (c>YC and D)) and not(post and abs(c-YC)<0.2):P.append(('stone',vase(0.5,c),(0,c)))
    if post:
        P.append(('stone',Part('石の柱','box',(0.39,YC-0.11,0,0.61,YC+0.11,0.80),RSTN),(0.5,0)))
        P.append(('stone',Part('かさ石','box',(0.37,YC-0.13,0.80,0.63,YC+0.13,0.86),RSTN),(0.5,0.5)))
    for z0,z1,w in((0,0.10,0.065),(0.58,0.70,0.075)):
        if L or R:
            x0=-0.4 if L else 0.5;x1=1.4 if R else 0.5
            P.append(('stone',Part('台' if z0==0 else '手すり','box',(x0,YC-w,z0,x1,YC+w,z1),RSTN),(0,0)))
        for y0,y1 in vsegs(m,YC,YC-0.11,YC+0.11):
            g='kv%d'%(z0*100)
            addv(P,'stonev',lambda a,b,z0=z0,z1=z1,w=w,g=g:Part('手すり','box',(0.5-w,a,z0,0.5+w,b,z1),RSTN,grp=g),y0,y1,RSTN)
    return P
IBS=(126,104,120);IBSD=(104,86,104);IBL=(120,150,112);IBF=(236,214,232)   # いばらの生垣（闇）：くき（くすんだむらさき）・葉・花
def scene_ibara(m):   # いばらの生垣（闇）：古木のくい（柱は角・はし、半径0.06・高さ0.85）に、いばらのくき（太さ0.028）を5本ずつ、波うたせてからめる。とげ（小さな円すい）・葉（小さな板）・うすいピンクの小さな花
    L,R,U,D=m&1,m&2,m&4,m&8;post=not(m in(3,12));P=[];YC=0.865
    import math as _m
    def vine(a,b,z,ph,horiz):   # a〜b を、高さ z のまわりで波うつ、いばらのくき（折れ線）
        n=10;pts=[]
        for i in range(n+1):
            t=a+(b-a)*i/n;dz=0.07*_m.sin(t*_m.pi*4+ph);dw=0.02*_m.cos(t*_m.pi*4+ph)
            pts.append((t,YC+dw,z+dz) if horiz else (0.5+dw,t,z+dz))
        return pts
    for z,ph,col in((0.12,0.0,IBSD),(0.27,1.7,IBS),(0.42,3.1,IBSD),(0.57,4.4,IBS),(0.72,5.6,IBSD)):
        if L or R:
            x0=-0.4 if L else 0.5;x1=1.4 if R else 0.5;pts=vine(x0,x1,z,ph,True)
            P.append(('vine',Part('くき','tube',(pts,0.028),col),None))
            for i in range(1,len(pts)-1):
                x,y,zz=pts[i]
                if i%2:P.append(('vine',Part('とげ','cone',(x,y+0.02,0.014,zz+0.01,zz+0.06),col),None))
                P.append(('leaf',Part('葉','plate',((x,y+0.03,zz-0.01),(x+0.07*(1 if i%2 else -1),y+0.04,zz+0.05),0.05,0.006),IBL),None))
            for i in range(2,len(pts)-1,4):
                x,y,zz=pts[i];P.append(('flower',Part('花','cyl',(x,y+0.035,0.022,zz+0.02,zz+0.03),IBF,detail=8),None))
        for y0,y1 in vsegs(m,YC,YC-0.06,YC+0.06):
            if y0<0:y0=0.0
            if y1>y0:P.append(('vine',Part('くき','tube',(vine(y0,y1,z,ph,False),0.028),col),None))
    if post:P.append(('post',Part('くい','cyl',(0.5,YC,0.06,0,0.85),(150,132,120)),(0,0)))
    return P
def scene_kuzure(m):   # くずれた石の欄干（闇）：運河の石の欄干と同じ組み方で、こけむした灰色の石。小柱は、ところどころかけている
    P=scene_rankan(m);out=[]
    for i,(k,p,o) in enumerate(P):
        p.col=MSTONE if p.col==RSTN else MSTONED if p.col==RSTND else p.col
        if p.name=='小柱' and (i*7)%5==0:continue   # かけた小柱
        out.append((k,p,o))
    return out
MSTONE=(178,176,170);MSTONED=(160,158,154)
FNS={'fence':scene_fence,'logfence':scene_log,'bamboofence':scene_bamboo,'misugaki':scene_misugaki,'wall':scene_wall,'parkfence':scene_park,'ropefence':scene_rope,'ashifence':scene_ashi,'rankan':scene_rankan,'ibara':scene_ibara,'kuzure':scene_kuzure}
def add_parts(sc,P):
    """部品を scene に足す（木目・石のもようの向きと場所もつける）。上のマスへのばした部品（ext）の番号をかえす"""
    ext_ids=set()
    for kind,p,org in P:
        if kind=='stone':sc.texture(TS)
        elif kind in('picket','post','railh','railv','ext') and p.col not in(BAM,BAMP,CRM,CRMP,PARKB,PARKW,REED,REEDG,BIND,RSTN,RSTND,IBS,IBSD,IBL,IBF,MSTONE,MSTONED):sc.texture(TW)
        else:sc.texture(None)
        sc.material('metal' if kind=='iron' else 'flat' if p.col==PARKW else None);p0=sc.pid;build(sc,[p]);sc.material(None)
        ids=range(p0+1,sc.pid+1)
        rot=org if isinstance(org,tuple) and org and org[0]=='rot' else None
        if rot:   # とびら：ちょうつがいのたての軸のまわりに、部品をまわす
            _,hx,hy,deg=rot;ca,sa=math.cos(math.radians(deg)),math.sin(math.radians(deg));idset=set(ids)
            def R_(v):dx,dy=v[0]-hx,v[1]-hy;return np.array([hx+dx*ca-dy*sa,hy+dx*sa+dy*ca,v[2]])
            sc.t=[(R_(t[0]),R_(t[1]),R_(t[2]),t[3],t[4]) if t[4] in idset else t for t in sc.t];org=None
        if kind=='ext':ext_ids|=set(ids)
        if org is not None and kind=='stone':
            for q in ids:sc.txo[q]=((0,0,0),int(org[0]*64)*7+int(org[1]*8)*37,int(org[1]*8)*19+5)
        if org is not None and kind in('picket','railh','railv','ext','post'):   # 木目：1マスでくりかえす（となりのマスとつながる）
            for q in ids:
                ax=(1,0,0) if kind=='railh' else (0,1,0) if kind in('railv','ext') else (0,0,1)
                sc.txo[q]=((0,0,0) if kind!='picket' else (org[0],org[1],0),(int(round(org[0]*4))*13+int(round(org[1]*8))*29) if kind=='picket' else 0,11);sc.txax[q]=np.array(ax,float)
    sc.texture(None);return ext_ids
def render(P,xr=(0,1)):
    sc=O.Scene();sc.txo={};sc.txax={};ext_ids=add_parts(sc,P);O.S=64
    ex=(xr[0]-0.5,xr[1]+0.5,-2.0,2.4);im=O.render_px(sc,O.game,ex,O.VIEW,k=0.80,lw=2,k2=0.90,merge=4)
    import furntone;im=furntone.tone(im)   # かげは家具と同じ5色（furntone。持ち主がきめた）。見え方はゲームのマスと同じなので、光は画面の向きのまま
    a=np.array(im).copy();ids=O.LAST_IDS
    if ext_ids:   # 上のマスへのばした横木と、そのまわりの線を消す
        em=np.isin(ids,list(ext_ids));own=(ids>=0)&~em;nb=np.zeros_like(em);no=np.zeros_like(em)
        for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):nb|=np.roll(np.roll(em,dy,0),dx,1);no|=np.roll(np.roll(own,dy,0),dx,1)
        a[em]=0;a[(ids<0)&nb&~no]=0
    a=a[:,32:32+int(round((xr[1]-xr[0])*64))]   # マスのはば（x 0〜64）で切る
    im=Image.fromarray(a);bb=im.getbbox();return im.crop(bb),bb[0]+int(round(xr[0]*64)),bb[1]-128
OLD={0:'H0',1:'HL',2:'HR',3:'HLR',4:'VU',8:'VD',12:'VUD'}
def build_all(iid):
    fn=FNS[iid];out={}
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
    for iid in([a for a in sys.argv[2:] if not a.startswith('-')] or ['fence','logfence','bamboofence','misugaki','wall']):
        res=build_all(iid);R[iid]=res;sheet(res,os.path.join(out,iid+'_lay.png'),LAY)
        for m,(im,ax,ay) in res.items():im.save(os.path.join(out,'%s_m%d.png'%(iid,m)));print(iid,m,im.size,ax,ay,len(set(map(tuple,np.array(im).reshape(-1,4)[np.array(im).reshape(-1,4)[:,3]>0].tolist()))),'色')
    if chips:
        import chips as CHP
        head,CC=CHP.load_imgs();names=[]
        for iid,res in R.items():
            for m,(im,ax,ay) in res.items():
                for nm in [iid+':m%d'%m]+([iid+':'+OLD[m]] if m in OLD else []):CC[nm]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]};names.append(nm)
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(names));print('チップに入れた',len(names))
