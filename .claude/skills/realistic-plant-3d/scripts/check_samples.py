"""Validate the bundled technique samples; does not certify botanical realism."""
from pathlib import Path
import numpy as np
import trimesh
from plant_geometry import leaf,tube,azimuths
l=leaf((0,0,0),(0,1,0),1,.3,bend=0,cup=0,twist=0,ripple=0,asym=0)
assert np.all(l.face_normals[:,2]>0)
t=tube([(0,0,0),(0,0,1)],[.2,.1])
assert t.is_watertight and t.is_winding_consistent and t.volume>0
assert list(azimuths(2,'opposite'))==[(0,0),(0,180),(1,90),(1,270)]
sc=trimesh.load(Path(__file__).resolve().parents[1]/'assets'/'geometry_samples.glb',force='scene')
n=0
for m in sc.geometry.values():
    assert len(m.vertices)>0 and np.isfinite(m.vertices).all() and np.all(m.area_faces>1e-13)
    n+=len(m.faces)
assert n>0
print(f'PASS: {len(sc.geometry)} meshes; {n} triangles. Geometry only; no botanical quality certification.')
