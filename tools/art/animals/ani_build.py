#!/usr/bin/env python3
"""飼う生き物（ani_rig.py）の、正面（d：手前へ歩く）・うしろ（u：奥へ歩く）のコマを写す。
  python3 tools/art/animals/ani_build.py <出力フォルダ> [hane moko tsuno] [--chips]
横（右むき）の設計図 furn3d/items/ani_<k>_<コマ>.py から、向きだけかえた設計図 ani_<k>_d<コマ>.py・ani_<k>_u<コマ>.py を作って写す（チップ ani:<k>#d<コマ>・#u<コマ>）。
向き（ani_rig.VROT）：まっすぐ正面から、少し右へ（顔が見える、少しななめ。ゲームで左右反転する）。--chips でゲームのチップにも入れる。"""
import sys,os,glob,importlib,re
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..');ITEMS=os.path.join(HERE,'..','furn3d','items')
sys.path[:0]=[HERE,os.path.join(HERE,'..','furn3d'),ITEMS,os.path.join(HERE,'..')]
import ani_rig
from PIL import Image
def gen(k):
    ids=[]
    for p in sorted(glob.glob(os.path.join(ITEMS,'ani_%s_*.py'%k))):
        fr=os.path.basename(p)[len('ani_%s_'%k):-3]
        if fr[0] in ani_rig.VROT:continue
        src=open(p).read()
        for vw in ani_rig.VROT:
            t=src.replace("#%s'"%fr,"#%s%s'"%(vw,fr)).replace(",'%s')"%fr,",'%s',rot=ani_rig.VROT['%s'])"%(fr,vw))
            t=t.replace('右むき（ani_rig.ROT）','%s（ani_rig.VROT。ani_build.py が作る）'%('正面' if vw=='d' else 'うしろ'),1)
            fn='ani_%s_%s%s'%(k,vw,fr);open(os.path.join(ITEMS,fn+'.py'),'w').write(t);ids.append(fn)
    return ids
def main():
    a=[x for x in sys.argv[1:] if not x.startswith('--')];out=a[0];ks=a[1:] or ['hane','moko','tsuno']
    import furn3d;os.makedirs(out,exist_ok=True);ALL={}
    for k in ks:
        for fn in gen(k):
            importlib.invalidate_caches();r=furn3d.run(fn,os.path.join(out,'_'+fn));(nm,v),=r.items();ALL[nm]=v
        names=[n for n in ALL if n.startswith('ani:%s#'%k)];ims=[ALL[n] for n in names]
        y0=min(ay for _,ax,ay in ims);x0=min(ax for _,ax,ay in ims);w=max(ax+i.width for i,ax,ay in ims)-x0+4;h=max(ay+i.height for i,ax,ay in ims)-y0+4
        sh=Image.new('RGBA',(w*len(ims),h),(150,190,120,255))
        for q,(im,ax,ay) in enumerate(ims):sh.alpha_composite(im,(q*w+ax-x0+2,ay-y0+2))
        sh.resize((sh.width*4,sh.height*4),Image.NEAREST).save(os.path.join(out,k+'_views.png'))
    if '--chips' in sys.argv:
        sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
        head,CC=CHP.load_imgs()
        for nm,(im,ax,ay) in ALL.items():CC[nm]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]}   # 横のコマと同じ：ax・ay は写した絵のまま（js/animals.js の drawAnimal）
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(ALL));print('チップに入れた',len(ALL))
if __name__=='__main__':main()
