#!/usr/bin/env python3
"""畑の作物9こ（トリポ、prompts.md の7回め。色なしの形だけ）を、作物ごとの glb にする。
  python3 tools/art/crop3d/crop_prep.py   → tools/art/models/tripo/crop_<作物><だん>.glb（mugi・imo・cab の1〜3）
もとのモデルは src/crops_tripo.glb。tripo_split.py で9こに切りわけ（へらさない）、つながった部品ごとに、色わけのマテリアル（目じるしの色）をつける。
色そのものは、写すときに設計図（furn3d/items/crop.py）で recol する。目じるしの色は natcommon.kind で見分ける色。
形の直し（持ち主がきめた）：じゃがいも1の、1まいだけ大きい葉を、ほかの葉くらいに（根もとへちぢめる）。キャベツ2の、まん中に立った葉をひくく（ひくい葉の輪に）。"""
import sys,os,subprocess,tempfile,numpy as np,trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'..','models','tripo');SRC=os.path.join(HERE,'src','crops_tripo.glb')
MK={'leaf':(60,180,60),'stem':(250,250,220),'cap':(220,40,40),'under':(240,220,200),'dot':(255,255,255)}   # 目じるし：葉・くき（麦の茎）・実（麦の穂・キャベツの玉）・花のまん中・花びら
ORDER={'mugi1':1,'mugi2':0,'mugi3':2,'imo1':3,'imo2':4,'imo3':5,'cab2':6,'cab1':7,'cab3':8}   # tripo_split の番号（grid.png の形と、モデルの中の高さを見てきめた。麦1と麦2は高さで：若い草のほうがひくい）
def comps(V,F):
    e=np.r_[F[:,[0,1]],F[:,[1,2]]];g=coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(len(V),)*2)
    return connected_components(g,directed=False)[1][F[:,0]]
def shrink_leaf(V,B,T,k=0.55,t0=0.15,t1=0.35,r=0.055):
    """B（根もと）から T（葉の先）へのびる葉だけを、根もとへ k 倍にちぢめる（t0〜t1 でなめらかに）"""
    B=np.array(B);a=np.array(T)-B;L2=a@a;t=(V-B)@a/L2;d=np.linalg.norm(V-B-np.outer(t,a),axis=1)
    sel=(t>t0)&(d<r);u=np.clip((t-t0)/(t1-t0),0,1);s=1-(1-k)*u*u*(3-2*u)
    V=V.copy();V[sel]=B+(V[sel]-B)*s[sel,None];return V,int(sel.sum())
def paint(nm,V,F):
    lab=comps(V,F);ids=np.unique(lab);C=np.empty(len(F),object);C[:]='leaf'
    nf={c:(lab==c).sum() for c in ids};vv={c:V[np.unique(F[lab==c])] for c in ids}
    if nm=='mugi3':
        for c in ids:
            if vv[c][:,1].min()>0.1:C[lab==c]='cap'   # 穂（と穂の先）
            else:C[lab==c]='stem'   # 茎と下の葉（実った麦は、ぜんぶ金色）
    elif nm=='imo3':
        big=max(ids,key=nf.get)
        for c in ids:
            if c==big or nf[c]<500:continue   # しげみと、花のうしろのがく（葉の色）
            fi=np.where(lab==c)[0];ctr=vv[c].mean(0);fc=V[F[fi]].mean(1)
            C[fi]=np.where(np.hypot(fc[:,0]-ctr[0],fc[:,1]-ctr[1])<0.011,'under','dot')   # 花：まん中は黄色、まわりは白い花びら（花は手前 +z を向く）
    elif nm=='cab3':
        head=min(ids,key=lambda c:np.linalg.norm(vv[c].mean(0)-[-0.015,0.135,0.035]))   # 玉（まん中の丸い部品）
        C[lab==head]='cap'
    return C
def run():
    tmp=tempfile.mkdtemp()
    subprocess.run([sys.executable,os.path.join(HERE,'..','models','tripo_split.py'),SRC,tmp,'--faces','20000'],check=True,capture_output=True)
    for nm,i in ORDER.items():
        m=trimesh.load(os.path.join(tmp,'obj%02d.glb'%i),force='mesh');V=np.asarray(m.vertices,float);F=np.asarray(m.faces)
        if nm=='imo1':V,n=shrink_leaf(V,(-0.01,0.09,-0.04),(-0.12,0.08,0.09));print(nm,'大きい葉の点',n)
        if nm=='cab2':
            lab=comps(V,F);tall=max(np.unique(lab),key=lambda c:V[np.unique(F[lab==c]),1].max());vi=np.unique(F[lab==tall]);y0=V[vi,1].min()
            V[vi,1]=y0+(V[vi,1]-y0)*0.6;print(nm,'立った葉の高さ',round(V[vi,1].max(),3))
        C=paint(nm,V,F);sc=trimesh.Scene()
        for k in MK:
            fi=np.where(C==k)[0]
            if not len(fi):continue
            ff=F[fi];vi=np.unique(ff);mp=-np.ones(len(V),int);mp[vi]=np.arange(len(vi))
            mat=trimesh.visual.material.PBRMaterial(name=k,baseColorFactor=[*MK[k],255],metallicFactor=0,roughnessFactor=1)
            sc.add_geometry(trimesh.Trimesh(V[vi],mp[ff],visual=trimesh.visual.TextureVisuals(material=mat),process=False),node_name=k,geom_name=k)
        sc.export(os.path.join(OUT,'crop_%s.glb'%nm));print(nm,{k:int((C==k).sum()) for k in MK},'高さ',round(V[:,1].max(),3))
if __name__=='__main__':run()
