# 木の3D（furn3d の scene と同じ三角形・色）を、面ごとの色つきの glb に書き出す（リアルなレンダリング用）
import sys;sys.path[:0]=['tools/art/furn3d','tools/art/furn3d/items','tools/art']
import numpy as np,trimesh,furn3d as F,oblique3d as O,tree   # 木の設計図（ほかの物は、ここをかえる）
O.GRAD=True;tree.SKEL='--skel' in sys.argv
sc,_=F.scene(tree,0)
V=[];C=[]
for a,b,c,col,pid in sc.t:
    f=sc.dc.get(pid);cc=col
    if f is not None:
        q=f(*((a+b+c)/3))
        if q is not None:cc=np.array(q,float)
    V+= [a,b,c];C.append(cc)
V=np.array(V);n=len(V)//3;Fc=np.arange(n*3).reshape(n,3)
V=np.stack([V[:,0],V[:,2],V[:,1]],1)   # ゲーム（x東・y南・z上）→ three.js（x・y上・z手前）
C=((np.clip(np.array(C),0,255)/255)**2.2)*255   # glTF の色は、明るさの直線の値
m=trimesh.Trimesh(V,Fc,process=False);m.visual.face_colors=np.c_[C,np.full(n,255)].astype(np.uint8)
m.export(sys.argv[1]);print(n,'tris')
