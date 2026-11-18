#!/usr/bin/env python3
"""ほたるのモデル（tools/art/models/animals/hotaru.glb）のお尻を黄色にする（点の色を書きかえて、glb に書きもどす。持ち主のきめ）。
お尻：もとのうすい黄色の所と、横から見て（crit_rig の向き）からだのうしろ 35% の茶色の所。三角形の3点ともお尻のときだけ。
  python3 tools/art/critter3d/hotaru_tail.py      （もう一度動かしても同じ）"""
import sys,os,numpy as np,trimesh
HERE=os.path.dirname(os.path.abspath(__file__));sys.path[:0]=[HERE,os.path.join(HERE,'..','furn3d'),os.path.join(HERE,'..')]
import crit_rig
GLB=os.path.join(HERE,'..','models','animals','hotaru.glb');TAIL=.35;YEL=(255,224,64)
rg=crit_rig.rig('hotaru');V,F,_=crit_rig._mc['hotaru'];x=crit_rig._turn(rg,V)[:,0]
s=trimesh.load(GLB,force='scene');g=list(s.geometry.values())[0];vc=np.asarray(g.visual.vertex_colors).copy();c=vc[:,:3].astype(float)
near=lambda col,t:np.abs(c-np.array(col,float)).max(1)<t
pale=near((251,239,134),20)|near(YEL,4);br=near((184,120,64),30);b=pale|br;x0,x1=x[b].min(),x[b].max()
m=pale|(br&(x<x0+(x1-x0)*TAIL));fm=m[F].all(1);mm=np.zeros(len(c),bool);mm[F[fm].ravel()]=True
vc[mm,:3]=YEL;g.visual.vertex_colors=vc;s.export(GLB);print('お尻の点',mm.sum())
