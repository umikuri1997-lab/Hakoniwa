"""Reusable local-coordinate mesh building blocks. Requires numpy, trimesh.
These are shape primitives, NOT a species generator. Coordinates: metres, Z up.
"""
import numpy as np
import trimesh


def unit(v):
    v=np.asarray(v,dtype=float); n=np.linalg.norm(v)
    if n<1e-10: raise ValueError('zero-length vector')
    return v/n


def frame(forward, up=(0,0,1)):
    f=unit(forward); u=np.asarray(up,dtype=float); u=u-np.dot(u,f)*f
    if np.linalg.norm(u)<1e-7:
        u=np.eye(3)[np.argmin(np.abs(f))]; u=u-np.dot(u,f)*f
    u=unit(u); s=unit(np.cross(u,f)); return f,s,u


def mesh(v, f, color):
    m=trimesh.Trimesh(vertices=v,faces=f,process=False)
    m.visual.face_colors=np.tile(np.asarray(color,dtype=np.uint8),(len(f),1))
    return m


def leaf(origin, direction, length, width, *, up=(0,0,1), profile=None,
         bend=-.15, cup=.07, twist=.15, ripple=.02, teeth=0, serration=.06,
         asym=.04, segments=28, columns=10, color=(75,132,55,255)):
    """Width is total max nominal blade width. Bend/cup relative to length;
    twist radians; teeth count per edge. Profile maps t to half-width factor.
    Mesh has single base/tip vertices, UVs; double-sided material. Petiole separate.
    """
    if length<=0 or width<=0 or segments<4 or columns<2: raise ValueError('invalid dimensions/resolution')
    if teeth: segments=max(segments, teeth*6)
    f,s,u=frame(direction,up); o=np.asarray(origin,dtype=float)
    profile=profile or (lambda t: np.sin(np.pi*t)**.8)
    verts=[o]; uv=[(0.5,0.)]; faces=[]
    for i in range(1,segments):
        t=i/segments; ang=twist*t
        ss=np.cos(ang)*s+np.sin(ang)*u; uu=-np.sin(ang)*s+np.cos(ang)*u
        mid=o+length*(t*f+bend*t*t*u)
        for j in range(columns+1):
            q=2*j/columns-1; edge=abs(q)**5
            tooth=(.5+.5*np.cos(2*np.pi*teeth*t))*serration if teeth else 0
            w=width*.5*max(0,profile(t))*(1-tooth*edge+asym*q*np.sin(2*np.pi*t))
            z=length*(cup*q*q*np.sin(np.pi*t)+ripple*edge*np.sin(5*np.pi*t+q)*np.sin(np.pi*t))
            verts.append(mid+ss*q*w+uu*z); uv.append(((q+1)/2,t))
    tip=len(verts); verts.append(o+length*(f+bend*u)); uv.append((.5,1))
    for j in range(columns): faces.append((0,1+j+1,1+j))
    for i in range(segments-2):
        a=1+i*(columns+1); b=a+columns+1
        for j in range(columns): faces.extend(((a+j,a+j+1,b+j+1),(a+j,b+j+1,b+j)))
    a=1+(segments-2)*(columns+1)
    for j in range(columns): faces.append((a+j,a+j+1,tip))
    # Ensure front normals point towards the requested up vector near the base.
    faces=np.asarray(faces)[:,::-1]
    m=mesh(verts,faces,color)
    material=trimesh.visual.material.PBRMaterial(baseColorFactor=list(color),roughnessFactor=.64,metallicFactor=0,doubleSided=True)
    m.visual=trimesh.visual.TextureVisuals(uv=np.asarray(uv),material=material)
    return m


def tube(points,radii,*,sides=12,ridge=.08,phase=0.,color=(112,82,53,255)):
    """Capped tapered tube with parallel-transport frames and restrained ridges."""
    p=np.asarray(points,dtype=float); r=np.asarray(radii,dtype=float)
    if len(p)<2 or len(p)!=len(r) or np.any(r<=0) or sides<3: raise ValueError('invalid tube')
    d=np.array([unit(p[min(i+1,len(p)-1)]-p[max(i-1,0)]) for i in range(len(p))]); _,a,b=frame(d[0]); vs=[]; fs=[]
    for i,(center,rad,tangent) in enumerate(zip(p,r,d)):
        a=a-np.dot(a,tangent)*tangent
        if np.linalg.norm(a)<1e-7: _,a,_=frame(tangent)
        a=unit(a); b=unit(np.cross(tangent,a))
        for j in range(sides):
            th=2*np.pi*j/sides; rr=rad*(1+ridge*np.sin(3*th+phase+i*.13))
            vs.append(center+rr*(np.cos(th)*a+np.sin(th)*b))
    for i in range(len(p)-1):
        for j in range(sides):
            a0=i*sides+j; a1=i*sides+(j+1)%sides; b0=a0+sides; b1=a1+sides
            fs.extend(((a0,a1,b1),(a0,b1,b0)))
    k=len(vs); vs.extend((p[0],p[-1])); end=(len(p)-1)*sides
    for j in range(sides): fs.extend(((k,(j+1)%sides,j),(k+1,end+j,end+(j+1)%sides)))
    return mesh(vs,fs,color)


def azimuths(nodes, mode, divergence=137.5, whorl=3):
    """Return (node index, degrees); specify real species leaf order first."""
    for i in range(nodes):
        if mode=='alternate': yield i,i*divergence%360
        elif mode=='opposite':
            for k in range(2): yield i,(i*90+k*180)%360
        elif mode=='distichous': yield i,(i*180)%360
        elif mode=='whorled':
            for k in range(whorl): yield i,(i*180/whorl+k*360/whorl)%360
        else: raise ValueError('unsupported leaf order')


def export_glb(scene,path):
    """GLB convention Y-up; convert geometry from Z-up once at export."""
    sc=scene.copy(); sc.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0])); sc.export(str(path),file_type='glb')
