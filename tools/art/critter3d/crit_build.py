#!/usr/bin/env python3
"""小さな生き物（crit_rig.py）のコマを写す。
  python3 tools/art/critter3d/crit_build.py <出力フォルダ> [名前...]          設計図（furn3d/items/crit_<名前>_<コマ>.py）を作り、写して、動く絵（GIF）を作る
  python3 tools/art/critter3d/crit_build.py <出力フォルダ> [名前...] --chips  ゲームのチップ（crit<名前>#<コマ>。名前を : で分けないのは、色の数（256）を生き物ごとに数えるため）にも入れる（アトラスは1回だけ作りなおす）
GIF（横・正面 d・うしろ u）：止まる（0・1）・歩く（w0〜w3）・何かする（e0〜e2）を、ゲームと同じ ax・ay でかさねて、6倍に。"""
import sys,os,importlib
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..');ITEMS=os.path.join(HERE,'..','furn3d','items')
sys.path[:0]=[HERE,os.path.join(HERE,'..','furn3d'),ITEMS,os.path.join(HERE,'..')]
import crit_rig
from PIL import Image
FOOTY=57   # 足もとの点の行（g64。絵の下のはしは BOTTOM 58）
OLD=('critfrog#0','critfrog#1')   # 前のかえるの絵（critter3d.py）。モデルから写した critkaeru にかえた
TPL='''# 小さな生き物（{name}）のチップ crit{name}#{fr}：持ち主のモデル（animals/{name}.glb）にボーンを入れて、ポーズをつけて写す（tools/art/critter3d/crit_rig.py。crit_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','critter3d'))
import crit_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='crit{name}#{fr}';PX=32;LW=1;GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('crit{name}#{fr}',0)]
def PARTS():
    p=P('{name}','model',('animals/{name}.glb',0.5,0.5,0,{size},0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=crit_rig.warp('{name}','{fr}')
    return[flat(notex(p))]+[notex(P('小物',k,d,c,on=('ground',),note='手にもつ')) for k,d,c in crit_rig.props('{name}','{fr}')]
'''
def gen(name):
    ids=[]
    for fr in crit_rig.frames(name):
        fn='crit_%s_%s'%(name,fr);open(os.path.join(ITEMS,fn+'.py'),'w').write(TPL.format(name=name,fr=fr,size=crit_rig.C[name]['size']));ids.append(fn)
    return ids
def gif(out,name,CH):
    import furn3d
    seqs=[[f for f in ('0','1') if f in CH],[f for f in ('w0','w1','w2','w3') if f in CH],[f for f in ('e0','e1','e2') if f in CH]]
    seqs=[q for q in seqs if q]
    x0=min(ax for _,ax,ay in CH.values());y0=min(ay for _,ax,ay in CH.values());x1=max(ax+i.width for i,ax,ay in CH.values());y1=max(ay+i.height for i,ax,ay in CH.values())
    w=x1-x0+8;h=max(y1,64)-y0+8;K=6;frames=[]
    for t in range(12):
        can=Image.new('RGBA',(w*len(seqs),h),(150,190,120,255))
        for q,sq in enumerate(seqs):
            f=sq[t%len(sq)] if q!=0 else sq[(t//3)%len(sq)];im,ax,ay=CH[f]
            for xx in range(w):can.putpixel((q*w+xx,58-y0+4),(120,160,96,255))   # 地面の線（足もと）
            can.alpha_composite(im,(q*w+ax-x0+4,ay-y0+4))
        frames.append(can.resize((can.width*K,can.height*K),Image.NEAREST))
    sh=Image.new('RGBA',(w*len(CH),h),(150,190,120,255))   # たしかめ用：コマを1列に
    for q,f in enumerate(CH):
        im,ax,ay=CH[f]
        for xx in range(w):sh.putpixel((q*w+xx,58-y0+4),(120,160,96,255))
        sh.alpha_composite(im,(q*w+ax-x0+4,ay-y0+4))
    sh.resize((sh.width*K,sh.height*K),Image.NEAREST).save(os.path.join(out,name+'_sheet.png'))
    frames[0].save(os.path.join(out,name+'.gif'),save_all=True,append_images=frames[1:],duration=160,loop=0,disposal=2)
def main():
    a=[x for x in sys.argv[1:] if not x.startswith('--')];out=a[0];names=a[1:] or list(crit_rig.C);chips='--chips' in sys.argv
    import furn3d;os.makedirs(out,exist_ok=True);ALL={}
    for name in names:
        CH={}
        for fn in gen(name):
            importlib.invalidate_caches();r=furn3d.run(fn,os.path.join(out,'_'+fn));(nm,v),=r.items();CH[nm.split('#')[1]]=v;ALL[nm]=v
        for vw in ('','d','u'):   # 横・正面（d）・うしろ（u）ごとに
            sub={k[len(vw):]:v for k,v in CH.items() if (k[0] in crit_rig.VIEWD)==bool(vw) and k.startswith(vw)}
            if sub:gif(out,name+vw,sub);print(name+vw,'GIF',os.path.join(out,name+vw+'.gif'))
    if chips:
        sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
        head,CC=CHP.load_imgs()
        for nm,(im,ax,ay) in ALL.items():CC[nm]={'g':64,'ax':ax-32,'ay':ay-FOOTY,'w':im.width,'h':im.height,'f':[im]}   # ax・ay：足もとの点（マスのまん中・地面）からのずれ（js/critters.js の drawCritter）
        for k in OLD:CC.pop(k,None)
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(ALL));print('チップに入れた',len(ALL))
if __name__=='__main__':main()
