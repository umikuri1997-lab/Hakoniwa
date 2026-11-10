# ノームの石像（stele、1×1マス）の3Dの下絵。土のせいれいの守りの像（まわりの壁・柵・塀がじょうぶになる）。
# 石の台座の上に、とんがり帽子・まるいひげ・まるい体のノームが、両手でスコップを持って立つ。ぜんぶ石。
# x=東, y=南, z=上（マス）。置くマスは(0,0)〜(1,1)。ゲームの見え方は 画面=(x, y-0.8z)。
# 出す絵（tools/art/gnome/ref/）：3d_full.png（マス目と置くマスのわく）、3d_side.png（まよこ）、sheet.png（絵をたのむときにわたす1まい：お手本のキューブ＋3D、1マス64ドット）
import math,sys,os
from PIL import Image
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
CX,CY=0.5,0.52
ST=(222,218,210);ST2=(196,190,182);ST3=(240,237,230)   # 石の色（明るい・ふつう・台座）
PED=dict(w=0.8,h=0.12)          # 台座：はば・高さ
BODY=dict(r=0.3,h=0.42)         # 体：半径・高さ（下が広い、まるい）
HEAD=dict(r=0.2)                # 頭
HAT=dict(r=0.22,h=0.55)          # とんがり帽子：半径・高さ
def build(sc):
    pz=PED['h'];w=PED['w']
    sc.box(CX-w/2,CY-w/2,0,CX+w/2,CY+w/2,pz,ST3,bevel=0.03)                     # 台座
    sc.box(CX-w/2-0.02,CY-w/2-0.02,0,CX+w/2+0.02,CY+w/2+0.02,0.05,ST2,bevel=0.015)  # 台座のすそ
    bz=pz;bh=BODY['h'];r=BODY['r']
    sc.revolve(CX,CY,[(0.0,bz+bh),(r*0.75,bz+bh*0.92),(r,bz+bh*0.5),(r*0.95,bz+0.04),(r*0.8,bz)],lambda k,i:ST,n=32)   # まるい体
    sc.sphere(CX-0.1,CY+0.05,bz+0.03,0.07,ST2,zs=0.6);sc.sphere(CX+0.1,CY+0.05,bz+0.03,0.07,ST2,zs=0.6)   # 足
    hz=bz+bh+HEAD['r']*0.6
    sc.sphere(CX,CY,hz,HEAD['r'],ST)                                              # 頭
    sc.sphere(CX,CY+0.12,hz-0.1,0.17,ST3,zs=1.15)                                # まるいひげ（前）
    sc.sphere(CX,CY+0.19,hz+0.01,0.055,ST2)                                        # 鼻
    tz=hz+HEAD['r']*0.35
    sc.revolve(CX,CY,[(0.0,tz+HAT['h']),(HAT['r']*0.5,tz+HAT['h']*0.5),(HAT['r'],tz+0.02),(HAT['r'],tz)],lambda k,i:ST2,n=32)   # とんがり帽子
    sc.ring_wall(CX,CY,HAT['r']+0.01,tz-0.01,tz+0.04,lambda *a:ST2,n=32)         # 帽子のふち
    # 両手でスコップ（右手の前に立てる）：柄・にぎり・刃
    sx=CX+0.26;sy=CY+0.22
    sc.box(sx-0.018,sy-0.018,bz,sx+0.018,sy+0.018,bz+0.6,ST2,bevel=0.005)        # 柄
    sc.box(sx-0.05,sy-0.02,bz+0.58,sx+0.05,sy+0.02,bz+0.62,ST2,bevel=0.005)       # にぎり
    sc.box(sx-0.06,sy-0.015,bz,sx+0.06,sy+0.015,bz+0.12,ST3,bevel=0.01)           # 刃（台座につく）
    sc.sphere(sx-0.02,sy-0.02,bz+0.36,0.06,ST);sc.sphere(sx-0.05,sy-0.04,bz+0.24,0.06,ST)   # 手
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(__file__),'ref')
os.makedirs(out,exist_ok=True)
sc=Scene();build(sc)
ext=(-1.0,2.0,-2.0,2.0)
fg=render(sc,game,ext,VIEW);bg=grid_bg(ext,(1,1));bg.alpha_composite(fg);bg.save(f'{out}/3d_full.png')
sext=(-1.0,2.0,-2.0,0.5);sd=render(sc,side,sext,SIDE);bg2=grid_bg(sext);bg2.alpha_composite(sd);bg2.save(f'{out}/3d_side.png')
cube=Image.open(os.path.join(os.path.dirname(__file__),'..','ref','view-cube.png')).convert('RGBA')
g=bg.resize((bg.width//2,bg.height//2),Image.BOX)
sh=Image.new('RGBA',(cube.width+16+g.width,max(cube.height,g.height)),(255,255,255,255));sh.paste(cube,(0,sh.height-cube.height));sh.paste(g,(cube.width+16,sh.height-g.height))
sh.convert('RGB').save(f'{out}/sheet.png')
b=fg.split()[3].point(lambda a:255 if a>20 else 0).getbbox();print('ok',(b[2]-b[0])/2,(b[3]-b[1])/2)
