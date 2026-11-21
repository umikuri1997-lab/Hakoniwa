# 限定の家具（トリポ）の設計図の道具：モデルの場所（glTF：x 右・y 上・z 手前）を、写すときのせかいの場所（x 東・y 南・z 上、マス）になおす。blueprint.model_tris と同じなおし方。
import os,numpy as np,trimesh,colorsys
M=os.path.join(os.path.dirname(__file__),'..','..','models','tripo','gf')
def frame(n,cx,cy,size):
    v=trimesh.load(os.path.join(M,n+'.glb'),force='mesh').vertices;lo,hi=v.min(0),v.max(0);k=size/(hi[1]-lo[1])
    w=lambda p:(cx+(p[0]-(lo[0]+hi[0])/2)*k,cy+(p[2]-(lo[2]+hi[2])/2)*k,(p[1]-lo[1])*k)
    return w,k,(hi-lo)*k
def sat(c,ks=1.0,kv=1.0):
    h,s,v=colorsys.rgb_to_hsv(*(np.asarray(c,float)/255));return np.array(colorsys.hsv_to_rgb(h,min(1,s*ks),min(1,v*kv)))*255
def objparts(ID,dims,fix=None):
    """持ち主がオブジェクトに分けたモデル：オブジェクト（glb のノード）ごとに、べつの部品（べつのマテリアル。さかいに線・かげも部品ごと）にする。
    色はどれもテクスチャ（gf/tex2.png）から、その部品の面だけでとる。fix：{ノードの名前: uvfix}（その部品だけの色の直し）"""
    from blueprint import Part as P,model_obj
    ob=model_obj(*dims);ps=[]
    for o in sorted(set(ob)):
        m=ob==o;p=P(ID+'.'+o,'model',dims,(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvsel=m
        p.fsel=lambda V,F,C,m=m:m
        f=(fix or {}).get(o)
        if f:p.uvfix=f
        ps.append(p)
    return ps
