# キャビネット・本棚の、よこ向き（右向き）の3Dのお手本。左向きはゲームで右向きの絵を反転して使う。
# set10_parts.py の部品の表をそのまま組んで、置くマスのまん中を軸に、正面（南）が東を向くように90度まわす。
# 出す絵：ref/rot_<id>.png（左からお手本のキューブ・正面の3D・右向きの3D・いまの絵。1マス128ドット、黄色いわくが置くマス）と、右向きの大きさ（1マス64ドット）。
import sys,os
import numpy as np
from PIL import Image,ImageDraw,ImageFont
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
sys.path.insert(0,os.path.join(HERE,'..'));sys.path.insert(0,HERE)
from oblique3d import Scene,render,game,VIEW,grid_bg
from blueprint import build
import set10_parts as SP
from set10_3d import panelold,EXT
def turn_right(sc,cx=0.5,cy=0.5):
    """正面（+y、南）が東（+x）を向くように、上から見て90度まわす：(x,y)→(cx+(y-cy), cy-(x-cx))"""
    T=lambda p:np.array([cx+(p[1]-cy),cy-(p[0]-cx),p[2]])
    sc.t=[(T(a),T(b),T(c),col,pid) for a,b,c,col,pid in sc.t];return sc
if __name__=='__main__':
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
    h,C=chips.load_imgs();out=os.path.join(HERE,'ref')
    fnt=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',20);G,TH=12,28
    cube=Image.open(os.path.join(HERE,'..','ref','view-cube.png')).convert('RGBA');cu=cube.resize((cube.width*2,cube.height*2),Image.NEAREST)
    for nm,id,foot,pf,ext in SP.OBJS:
        if id not in('cabinet','shelf1'):continue
        sc=Scene();build(sc,pf());a=grid_bg(EXT,foot);a.alpha_composite(render(sc,game,EXT,VIEW))
        sr=turn_right(Scene() if False else (lambda s:(build(s,pf()),s)[1])(Scene()));r=render(sr,game,EXT,VIEW);b=grid_bg(EXT,foot);b.alpha_composite(r)
        bb=r.split()[3].getbbox();print(id,'右向きの大きさ %d×%d（1マス64ドット）'%(round((bb[2]-bb[0])/2),round((bb[3]-bb[1])/2)))
        c=panelold(id,foot,C)
        P=[(cu,''),(a,'正面の3D（いまの向き）'),(b,'右向きの3D（かいてほしい向き）'),(c,'いまの絵（デザイン・正面）')]
        W=sum(p.width for p,_ in P)+G*(len(P)+1);H=max(p.height for p,_ in P)+TH+G
        one=Image.new('RGBA',(W,H),(255,255,255,255));d=ImageDraw.Draw(one);x=G
        for p,t in P:
            one.paste(p,(x,H-p.height-G//2 if p is cu else TH));d.text((x,4),t,font=fnt,fill=(60,60,60));x+=p.width+G
        d.text((G,4),nm,font=fnt,fill=(60,60,60))
        one.convert('RGB').save(os.path.join(out,'rot_%s.png'%id))
