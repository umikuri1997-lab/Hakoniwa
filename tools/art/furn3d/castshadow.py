# 落ち影（地面に落ちるかげ）：チップと同じ3D・同じカメラで、根もとの高さ（地面 z=0）に見えない平面を置き、光から影を落として写す。
# 使い方：python3 tools/art/furn3d/castshadow.py <設計図> <出力フォルダ> [--chips]
#   光：自然の物の太陽（natcommon.SUN）。どの物・どの絵も同じ光（モデルをまわした絵でも、光はまわさない）。
#   影：3Dの三角形を、光の向きに平面へうつした形が、影のある所（光が物にさえぎられる所）。それをチップと同じカメラで写す。
#   出す物：<チップの名前>:sh。ゲームで左右反対にも描く物（FLIPIDS）は :shf も（反対にしても光は同じ向きなので、光を反対にして作ってから反対にする）。
#   色：影の形を BLUR（ドット）でぼかし、こさで2色（SHD こい・SHL うすい）にわける。色のさかいめ（BANDS）は市松もようのあみかけ（マスの左上からのドットで、となりのマスとつながる）。
#   ゲームでは、物より先に、地面の上に描く（drawCastShadows）。
import sys,os
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(HERE,'items'));sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(ROOT,'tools'))
import numpy as np
from PIL import Image,ImageDraw
import furn3d as F,oblique3d as O,chips as CHP
SHD=(40,46,104,100);SHL=(40,46,104,52)   # 影の2色（こい・うすい。うすさ/255）。青むらさき（日なたはあたたかく・かげは青く）
BLUR=2.0   # ぼかし（ドット）
BANDS=(0.21,0.24,0.585,0.615)   # ぼかしたこさのさかい：なし｜うすいのあみ｜うすい｜うすい・こいのあみ｜こい
FLIPIDS={'deadtree'}   # ゲームで左右反対にも描く物
from natcommon import SUN
def shadow(M,k,L,mirror,chip):
    sc,_=F.scene(M,k);T=np.array([[a,b,c] for a,b,c,col,pid in sc.t])   # 三角形の点（マス。z は高さ）
    inf={};im=F.shot(M,k,info=inf)[0];bb=im.getbbox();P,E,S_=inf['PROJ'],inf['ext'],inf['S']
    if mirror:L=L*np.array([-1,1,1])
    G=T-T[...,2:3]/L[2]*L;G[...,2]=0   # 光の向きに、地面の平面へうつす
    px=lambda g:((P(g)[0]-E[0])*S_-bb[0]+chip['ax'],(P(g)[1]-E[2])*S_-bb[3]+chip['ay']+chip['h'])   # チップと同じ場所（g64のドット、マスの左上から）
    Q=np.array([[px(g) for g in t] for t in G])
    if mirror:Q[...,0]=64-Q[...,0]   # ゲームの反対の絵は、マスのはば（64）の中で反対にする
    x0,y0=int(np.floor(Q[...,0].min()))-1,int(np.floor(Q[...,1].min()))-1;x1,y1=int(np.ceil(Q[...,0].max()))+1,int(np.ceil(Q[...,1].max()))+1
    m=Image.new('L',(x1-x0,y1-y0),0);d=ImageDraw.Draw(m)
    for t in Q:d.polygon([(a-x0,b-y0) for a,b in t],fill=255)
    from scipy.ndimage import gaussian_filter
    P_=int(np.ceil(BLUR*3));a=gaussian_filter(np.pad(np.array(m,float)/255,P_),BLUR);x0-=P_;y0-=P_;Hh,Ww=a.shape
    yy,xx=np.mgrid[0:Hh,0:Ww];ck=((xx+x0+yy+y0)%2)==0   # 市松もよう（マスの左上からのドット）
    b0,b1,b2_,b3=BANDS;lt=((a>=b0)&(a<b1)&ck)|((a>=b1)&(a<b2_))|((a>=b2_)&(a<b3)&~ck);dk=((a>=b2_)&(a<b3)&ck)|(a>=b3)
    o=np.zeros((Hh,Ww,4),np.uint8);o[lt]=SHL;o[dk]=SHD;out=Image.fromarray(o)
    b2=out.getbbox();return out.crop(b2),x0+b2[0],y0+b2[1]
def run(iid,out,chips=False):
    M=F.load(iid);os.makedirs(out,exist_ok=True);L=np.array(SUN);print(iid,'光',np.round(L,3),'高さの角度',round(float(np.degrees(np.arcsin(L[2]))),1))
    head,CC=CHP.load_imgs();CH={}
    for v_ in M.VIEWS:
        nm,k=v_[:2];M.VAR=v_[2] if len(v_)>2 else None
        for mir,suf in((False,':sh'),(True,':shf'))[:2 if M.ID in FLIPIDS else 1]:
            im,ax,ay=shadow(M,k,L,mir,CC[nm]);CH[nm+suf]=(im,ax,ay);print('%s %dx%d ax %d ay %d'%(nm+suf,im.width,im.height,ax,ay))
            im.save(os.path.join(out,(nm+suf).replace('#','_').replace(':','_')+'.png'))
    if chips:
        for nm,(im,ax,ay) in CH.items():CC[nm]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]}
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(CH));print('チップに入れた',len(CH))
    return CH
if __name__=='__main__':run(sys.argv[1],sys.argv[2],'--chips' in sys.argv)
