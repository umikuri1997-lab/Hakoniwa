#!/usr/bin/env python3
"""洞窟のバケモノ（bake_rig.py）のコマを写す。
  python3 tools/art/cave/bake_build.py <出力フォルダ> [名前...] [--chips]
  チップの名前は bk<名前>#<コマ>（色の数を、バケモノごとに数える）。ax・ay は足もとの点（マスのまん中・地面）からのずれ（g64）。"""
import sys,os,importlib
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..');ITEMS=os.path.join(HERE,'..','furn3d','items')
sys.path[:0]=[HERE,os.path.join(HERE,'..','furn3d'),ITEMS,os.path.join(HERE,'..')]
import bake_rig
from PIL import Image
FOOTY=57
TPL='''# 洞窟のバケモノ（{name}）のチップ bk{name}#{fr}：トリポのモデル（models/cave/bk_{name}.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bk{name}#{fr}';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bk{name}#{fr}',0)]
def PARTS():
    p=P('{name}','model',('cave/bk_{name}.glb',0.5,0.5,0,{size},{rot},0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('{name}','{fr}');p.fsel=bake_rig.tear('{name}');p.remesh=bake_rig.remesh('{name}');p.paint=bake_rig.paint('{name}')
    return[flat(notex(p))]
'''
def gen(name):
    ids=[]
    for fr in bake_rig.frames(name):
        fn='bk_%s_%s'%(name,fr);open(os.path.join(ITEMS,fn+'.py'),'w').write(TPL.format(name=name,fr=fr,size=bake_rig.PAL[name]['size'],rot=bake_rig.PAL[name].get('rot',0)));ids.append(fn)
    return ids
def sheet(out,name,CH,K=4):
    x0=min(ax for _,ax,ay in CH.values());y0=min(ay for _,ax,ay in CH.values());x1=max(ax+i.width for i,ax,ay in CH.values());y1=max(ay+i.height for i,ax,ay in CH.values())
    w=x1-x0+8;h=max(y1,64)-y0+8;sh=Image.new('RGBA',(w*len(CH),h),(70,62,56,255))
    for q,f in enumerate(CH):
        im,ax,ay=CH[f]
        for xx in range(w):sh.putpixel((q*w+xx,58-y0+4),(50,44,40,255))
        sh.alpha_composite(im,(q*w+ax-x0+4,ay-y0+4))
    sh.resize((sh.width*K,sh.height*K),Image.NEAREST).save(os.path.join(out,name+'_sheet.png'))
def main():
    a=[x for x in sys.argv[1:] if not x.startswith('--')];out=a[0];names=a[1:] or list(bake_rig.PAL);chips='--chips' in sys.argv
    import furn3d;os.makedirs(out,exist_ok=True);ALL={}
    for name in names:
        CH={}
        for fn in gen(name):
            importlib.invalidate_caches();r=furn3d.run(fn,os.path.join(out,'_'+fn));(nm,v),=r.items();CH[nm.split('#')[1]]=v;ALL[nm]=v
        sheet(out,name,CH);print(name,os.path.join(out,name+'_sheet.png'))
    if chips:
        sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
        head,CC=CHP.load_imgs()
        for nm,(im,ax,ay) in ALL.items():CC[nm]={'g':64,'ax':ax-32,'ay':ay-FOOTY,'w':im.width,'h':im.height,'f':[im]}
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(ALL));print('チップに入れた',len(ALL))
if __name__=='__main__':main()
