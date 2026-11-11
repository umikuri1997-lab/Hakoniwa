# 8つの物（set10_parts.py）の設計図と3D。いまの絵のデザインのまま、角度だけゲームに合わせてかきなおしてもらうためのお手本。
# 出す絵：ref/bp_<n>_<id>.png（設計図）、ref/<n>_<id>.png（左からお手本のキューブ・3D・いまの絵。1マス128ドット、黄色いわくが置くマス）
# と、3Dの大きさ（1マス64ドットの絵で、はば×高さ）を出す（プロンプトに書く数）。
import sys,os
from PIL import Image,ImageDraw,ImageFont
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
sys.path.insert(0,os.path.join(HERE,'..'));sys.path.insert(0,HERE)
from oblique3d import Scene,render,game,VIEW,grid_bg
from blueprint import build,blueprint
import set10_parts as SP
EXT=(-1.0,3.0,-1.5,2.5)
def panelold(id,foot,C):
    bg=grid_bg(EXT,foot);v=C[id];k=2 if v.get('g')==64 else 4
    ox,oy=round(-EXT[0]*128),round(-EXT[2]*128)
    im=v['f'][0].convert('RGBA');im=im.resize((im.width*k,im.height*k),Image.NEAREST);bg.alpha_composite(im,(ox+round(v['ax']*k),oy+round(v['ay']*k)));return bg
if __name__=='__main__':
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
    h,C=chips.load_imgs();out=os.path.join(HERE,'ref');os.makedirs(out,exist_ok=True)
    fnt=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',20);G,TH=12,28
    cube=Image.open(os.path.join(HERE,'..','ref','view-cube.png')).convert('RGBA');cu=cube.resize((cube.width*2,cube.height*2),Image.NEAREST)
    for n,(nm,id,foot,pf,ext) in enumerate(SP.OBJS):
        bad=blueprint(os.path.join(out,'bp_%d_%s.png'%(n+1,id)),'%d %s'%(n+1,nm),pf(),foot,ext)
        if bad:print('ささえのまちがい',id,bad)
        sc=Scene();build(sc,pf());a=grid_bg(EXT,foot);r=render(sc,game,EXT,VIEW);a.alpha_composite(r)
        sc2=Scene();build(sc2,[p for p in pf() if '（かかない）' not in p.name]);bb=render(sc2,game,EXT,VIEW).split()[3].getbbox()
        print(id,'大きさ %d×%d（1マス64ドット）'%(round((bb[2]-bb[0])/2),round((bb[3]-bb[1])/2)))
        b=panelold(id,foot,C)
        one=Image.new('RGBA',(cu.width+a.width+b.width+4*G,max(cu.height,a.height,b.height)+TH+G),(255,255,255,255));d=ImageDraw.Draw(one)
        one.paste(cu,(G,one.height-cu.height-G//2));one.paste(a,(cu.width+2*G,TH));one.paste(b,(cu.width+a.width+3*G,TH))
        d.text((G,4),'%d %s'%(n+1,nm),font=fnt,fill=(60,60,60));d.text((cu.width+2*G,4),'3D（角度・大きさ）',font=fnt,fill=(60,60,60));d.text((cu.width+a.width+3*G,4),'いまの絵（デザイン）',font=fnt,fill=(60,60,60))
        one.convert('RGB').save(os.path.join(out,'%d_%s.png'%(n+1,id)))
