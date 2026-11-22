"""洞窟のバケモノの骨の重みを、Blender（pip の bpy）の自動の重み（ボーンヒート）で作る。リギングのスキル（.claude/skills/rigging）のやり方。
  pip install bpy   （Blender 5.3 のモジュール。Python 3.13）
  python3 tools/art/cave/bake_heat.py tame [ほかの名前...]
骨は bake_rig.SKEL（モデルの高さを1とした場所）。モデルは、写すときと同じ点の番号・同じ場所（UV のつなぎ目の点は1つにまとめる）で Blender に入れ、
アーマチュアと「自動のウェイト」でペアレントして、頂点グループの重みを heat/<名前>.npz に書く（bake_rig.weights が読む）。"""
import sys,os
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(HERE,'..'))
import numpy as np
import blueprint as bp,bake_rig as br
OUT=os.path.join(HERE,'heat')
MERGE=.002   # この長さより近い点をまとめる（モデルの高さを1として）
SC=10.0   # 大きさ（モデルの高さ1のままだと、ボーンヒートがとけずに、重みがぜんぶの骨にうすく広がる）

def main(name):
    import bpy
    V,F,C=bp.model_tris('cave/bk_%s.glb'%name,.5,.5,0,br.PAL[name]['size'],br.PAL[name].get('rot',0),0)
    H,cx,cy=br._norm(name,V);P=np.c_[(V[:,0]-cx)/H,(V[:,1]-cy)/H,V[:,2]/H]
    _,uid=np.unique(np.round(V,5),axis=0,return_inverse=True);uid=uid.ravel();n=uid.max()+1
    Pu=np.zeros((n,3));np.add.at(Pu,uid,P);Pu/=np.bincount(uid,minlength=n)[:,None]
    Fu=uid[F];Fu=Fu[(Fu[:,0]!=Fu[:,1])&(Fu[:,1]!=Fu[:,2])&(Fu[:,0]!=Fu[:,2])]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    import bmesh
    me=bpy.data.meshes.new(name);me.from_pydata((Pu*SC).tolist(),[],Fu.tolist());me.update()
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=MERGE*SC);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();me.update()   # 近い点をまとめ、面の向きをそろえる（しないと、ボーンヒートがとけない）
    ob=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(ob)
    ad=bpy.data.armatures.new('ARM_'+name);ar=bpy.data.objects.new('ARM_'+name,ad);bpy.context.scene.collection.objects.link(ar)
    bpy.context.view_layer.objects.active=ar;bpy.ops.object.mode_set(mode='EDIT')
    eb={}
    for bn,par,h,t in br.SKEL[name]:
        b=ad.edit_bones.new(bn);b.head=tuple(np.array(h)*SC);b.tail=tuple(np.array(t)*SC)
        if par:b.parent=eb[par];b.use_connect=False
        eb[bn]=b
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);ar.select_set(True);bpy.context.view_layer.objects.active=ar
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    names=[b[0] for b in br.SKEL[name]];Wm=np.zeros((len(me.vertices),len(names)))
    gi={g.index:names.index(g.name) for g in ob.vertex_groups if g.name in names}
    for v in me.vertices:
        for g in v.groups:
            if g.group in gi:Wm[v.index,gi[g.group]]=g.weight
    from scipy.spatial import cKDTree
    co=np.array([v.co[:] for v in me.vertices])/SC;_,nn=cKDTree(co).query(Pu);W=Wm[nn]   # まとめたあとの点から、もとの点へ
    miss=(W.sum(1)==0).sum()
    if miss:   # ボーンヒートでとどかなかった点（はなれた小さな部品）は、いちばん近い、重みのある点と同じに
        ok=W.sum(1)>0;bi=np.where(ok)[0];_,k=cKDTree(Pu[bi]).query(Pu[~ok]);W[~ok]=W[bi[k]]
    os.makedirs(OUT,exist_ok=True);np.savez_compressed(os.path.join(OUT,name+'.npz'),W=W.astype(np.float32),n=n,names=np.array(names))
    print(name,'点',n,'重みのない点',int(miss))

if __name__=='__main__':
    for a in sys.argv[1:]:main(a)
