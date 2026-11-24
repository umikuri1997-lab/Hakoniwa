#!/usr/bin/env python3
"""土のステージの自然の物（トリポ 8回め：6こを1つのモデル。色なしの glb）を、自然物のチップ用に1つずつの glb にする。
  0) もらったモデルは、2だんが上下にかさなって（上のだんは宙に）来たので、上のだんを床におろし、うしろへずらしてから切りわける：
     python3 tools/art/tsuchi/tsuchi_prep.py floor <もらった.glb> <フォルダ>/model_floor.glb
  1) python3 tools/art/models/tripo_split.py <フォルダ>/model_floor.glb <フォルダ>/split --names olive,iwakusa,susuki,iwakagami,sandrock,sagan --faces 8000
  2) python3 tools/art/tsuchi/tsuchi_prep.py mark <フォルダ>/split   → tools/art/models/tripo/olive.glb など（目じるしの色つき）
目じるしの色（nature_prep.MK）：幹 bark・葉 leaf・オリーブの実 cap・すすきの穂 under・いわかがみのじく stem・花 cap・岩 rock。色そのものは設計図（furn3d/items/nat_*.py）で recol する。"""
import sys,os,numpy as np,trimesh
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,os.path.join(HERE,'..','nature3d'))
from nature_prep import MK,comps
OUT=os.path.join(HERE,'..','models','tripo')
def floor(src,dst):
    s=trimesh.load(src,force='mesh');out=[]
    for p in s.split(only_watertight=False):
        p=p.copy();b=p.bounds;c=b.mean(0);col=0 if c[0]<-1/6 else (1 if c[0]<1/6 else 2);top=b[0][1]>0.27
        if top and col==1 and b[0][1]>0.34 and c[0]<0:col=0   # 宙にあるオリーブの葉（いわ草の葉は、みな床から）
        p.apply_translation(((col-1)*0.5,-0.322,-0.7) if top else ((col-1)*0.5,0,0));out.append(p)
    trimesh.util.concatenate(out).export(dst)
def mark(src):
    os.makedirs(OUT,exist_ok=True)
    for nm in('olive','iwakusa','susuki','iwakagami','sandrock','sagan'):
        m=trimesh.load(os.path.join(src,nm+'.glb'),force='mesh');V=np.asarray(m.vertices);F=np.asarray(m.faces);lab=comps(m);C=np.zeros((len(F),3));ids=np.unique(lab)
        nf={c:(lab==c).sum() for c in ids};big=max(ids,key=lambda c:nf[c]);ctr=V[F].mean(1)
        for c in ids:
            fi=lab==c;vv=V[np.unique(F[fi])];ex=vv.max(0)-vv.min(0)
            if nm=='olive':   # いちばん大きな部品＝幹と枝。はなれた小さな部品は葉、まるい物（3方向の大きさがそろう）はオリーブの実
                C[fi]=MK['bark'] if c==big else MK['cap'] if ex.min()>0.84*ex.max() and nf[c]>=40 else MK['leaf']
            elif nm=='iwakusa':C[fi]=MK['leaf']
            elif nm=='susuki':C[fi]=MK['under'] if nf[c]>=170 and vv[:,1].min()>0.12 else MK['leaf']   # 穂：高い所の大きな部品
            elif nm=='iwakagami':   # 葉はひくい部品。じくのある部品は、高い所が花（つりがね）
                if vv[:,1].max()<0.13:C[fi]=MK['leaf']
                else:
                    f=np.where(fi)[0];C[f]=np.where((ctr[f,1]>0.135)[:,None],MK['cap'],MK['stem'])
            else:C[fi]=MK['rock']
        VV=V[F].reshape(-1,3);FF=np.arange(len(VV)).reshape(-1,3);CC=np.repeat(C,3,0)   # 面ごとの色を、点をわけて持たせる
        trimesh.Trimesh(VV,FF,vertex_colors=np.c_[CC,np.full(len(CC),255)].astype(np.uint8),process=False).export(os.path.join(OUT,nm+'.glb'))
        print(nm,len(FF),'面',{k:int((np.abs(C-np.array(v)).sum(1)<1).sum()) for k,v in MK.items() if (np.abs(C-np.array(v)).sum(1)<1).any()})
if __name__=='__main__':
    if sys.argv[1]=='floor':floor(sys.argv[2],sys.argv[3])
    else:mark(sys.argv[2])
