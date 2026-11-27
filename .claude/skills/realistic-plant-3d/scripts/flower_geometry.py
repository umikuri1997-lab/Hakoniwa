"""Parametric surface primitives, metres, Z-up. Not complete botanical assets.
Requires numpy and trimesh. Shape parameters are artistic examples, not species data.
"""
import numpy as np
import trimesh
from plant_geometry import frame, export_glb


def surface(vertices, faces, rgba):
    m = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    mat = trimesh.visual.material.PBRMaterial(baseColorFactor=list(rgba), roughnessFactor=.78, metallicFactor=0, doubleSided=True)
    m.visual = trimesh.visual.TextureVisuals(material=mat)
    return m


def petal(origin, direction, length, width, *, up=(0,0,1), bend=.15, curl=-.12,
          cup=.18, twist=.12, wave=.025, tip_width=.34, rows=36, cols=16,
          rgba=(231,140,160,255)):
    """Broad petal with separate longitudinal bend, rolled cross-section and rounded tip.
    The last row traces a rounded rim rather than converging to a sharp point.
    """
    f,s,u=frame(direction,up); o=np.asarray(origin,float)
    verts=[]; faces=[]
    for i in range(rows+1):
        t=i/rows; a=twist*t
        ss=np.cos(a)*s+np.sin(a)*u; uu=-np.sin(a)*s+np.cos(a)*u
        w=width*.5*(.045+(1-.045)*(np.sin(np.pi*t*.79)**.72))*(1-(1-tip_width)*t**9)
        for j in range(cols+1):
            q=2*j/cols-1
            x=length*(t-.13*t**7*q*q)
            z=length*(bend*t*t+curl*t**5+cup*q*q*np.sin(np.pi*t*.86)+wave*abs(q)**5*t*t*np.sin(7*np.pi*t+2*q))
            verts.append(o+x*f+q*w*ss+z*uu)
    for i in range(rows):
        for j in range(cols):
            a=i*(cols+1)+j; b=a+cols+1
            faces.extend([(a,b,a+1),(a+1,b,b+1)])
    return surface(verts,faces,rgba)


def funnel(origin, height, throat_radius, rim_radius, *, flare=2.8, lobes=5,
           wave=.06, rows=36, sides=96, rgba=(110,145,230,255)):
    """Continuous fused corolla tube; no separate petal plates."""
    o=np.asarray(origin,float); verts=[]; faces=[]
    for i in range(rows+1):
        t=i/rows
        for j in range(sides):
            a=2*np.pi*j/sides
            r=(throat_radius+(rim_radius-throat_radius)*t**flare)*(1+wave*t**6*np.cos(lobes*a))
            z=height*(t+wave*.65*t**7*np.cos(lobes*a+.2))
            verts.append(o+np.array([r*np.cos(a),r*np.sin(a),z]))
    for i in range(rows):
        for j in range(sides):
            a=i*sides+j; b=i*sides+(j+1)%sides
            faces.extend([(a,b,b+sides),(a,b+sides,a+sides)])
    return surface(verts,faces,rgba)


def overlapping_demo(origin=(0,0,0), seed=11):
    """Demonstrates staggered overlapping curved petals. Not a finished rose."""
    rng=np.random.default_rng(seed); o=np.asarray(origin,float); sc=trimesh.Scene()
    for layer,(n,r,l,w,z) in enumerate([(7,.032,.10,.074,.0),(6,.023,.082,.069,.012),(5,.015,.065,.054,.021),(4,.007,.046,.040,.027)]):
        for i in range(n):
            a=2*np.pi*(i+.44*layer)/n+rng.uniform(-.09,.09)
            p=o+np.array([r*np.cos(a),r*np.sin(a),z]); d=(np.cos(a),np.sin(a),.27+.24*layer)
            m=petal(p,d,l*rng.uniform(.94,1.06),w,bend=.12+.04*layer,curl=-.19+.075*layer,cup=.21,twist=rng.uniform(-.13,.13),rgba=(235-layer*8,150-layer*10,173-layer*7,255))
            sc.add_geometry(m,geom_name=f'layer{layer}_petal{i}')
    return sc


if __name__=='__main__':
    from pathlib import Path
    sc=overlapping_demo()
    sc.add_geometry(petal((.35,0,0),(1,0,.25),.13,.10),geom_name='petal_surface')
    sc.add_geometry(funnel((-.38,0,0),.09,.014,.105),geom_name='fused_corolla')
    path=Path(__file__).resolve().parents[1]/'assets'/'flower_primitives.glb'
    export_glb(sc,path)
    loaded=trimesh.load(path,force='scene')
    assert len(loaded.geometry)==24
    for m in loaded.geometry.values():
        assert np.isfinite(m.vertices).all() and len(m.faces)>0 and np.min(m.area_faces)>1e-12
    print('GLB reload:',len(loaded.geometry),'meshes;',sum(len(m.faces) for m in loaded.geometry.values()),'triangles')
