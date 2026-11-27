"""Original lightweight Salvia splendens inflorescence study. No foliage. Requires numpy, trimesh, Pillow; exports Y-up metres."""
from pathlib import Path
import argparse, numpy as np, trimesh
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

def texture(kind,folder):
    folder.mkdir(parents=True,exist_ok=True)
    y,x=np.mgrid[0:256,0:256]/255
    if kind=='corolla':
        a=np.sin(np.pi*y*.8); base=np.stack([205+43*a,24+16*a+5*np.cos(2*np.pi*x),30+12*a],-1); rough=175+10*np.cos(np.pi*y)
    else:
        rib=np.cos(2*np.pi*x*5); base=np.stack([155+37*y+8*rib,22+12*y+3*rib,24+7*y],-1); rough=190+7*rib
    for name,data in [('basecolor',base),('roughness',rough)]:
        Image.fromarray(np.uint8(np.clip(data,0,255))).save(folder/(name+'.png'))
    # Restrained microstructure. Neutral normal map; no fictitious large relief.
    Image.fromarray(np.tile(np.uint8([128,128,255]),(256,256,1))).save(folder/'normal.png')
    mr=Image.fromarray(np.stack([np.full((256,256),255),rough,np.zeros((256,256))],-1).astype('uint8'))
    return trimesh.visual.material.PBRMaterial(name=kind,baseColorTexture=Image.open(folder/'basecolor.png').copy(),normalTexture=Image.open(folder/'normal.png').copy(),metallicRoughnessTexture=mr,metallicFactor=0,roughnessFactor=1,doubleSided=True)

def build(seed=12,lod=1):
    rng=np.random.default_rng(seed); parts={'calyx':[], 'corolla':[]}; folder=ROOT/'assets'/'salvia'/'textures'
    mats={k:texture(k,folder/k) for k in parts}
    def surface(verts,uv,faces,kind):
        m=trimesh.Trimesh(vertices=verts,faces=faces,process=False); m.visual=trimesh.visual.TextureVisuals(uv=uv,material=mats[kind]);parts[kind].append(m)
    def ringmesh(origin,az,length,width,kind,rows,sides,bend=0,bud=False):
        # Local longitudinal, lateral and dorsal axes; asymmetrical bilabiate rim.
        d=np.array([np.cos(az),np.sin(az),.12 if kind=='calyx' else -.10]);d/=np.linalg.norm(d)
        a=np.array([-np.sin(az),np.cos(az),0]);b=np.cross(d,a)
        vs=[];uv=[];fs=[]
        for i in range(rows+1):
            t=i/rows
            for j in range(sides+1):
                # Exact seam coordinates for continuous surface and UV island.
                th=2*np.pi*(j%sides)/sides; dorsal=np.sin(th)
                if kind=='calyx':
                    rad=width*(.35+.65*np.sin(np.pi*.72*t)); lip=(.11*dorsal+.11*np.cos(2*th))*t**6
                    if bud:rad*=1-.80*t**5
                else:
                    rad=width*(.48+.52*t**.7);lip=(.20*dorsal+.08*np.cos(2*th))*t**6
                    if bud:rad*=1-.83*t**5
                p=origin+d*length*(t+lip)+a*rad*np.cos(th)+b*(rad*.82*dorsal+bend*t*t)
                vs.append(p);uv.append([j/sides,t])
        for i in range(rows):
            for j in range(sides):
                k=i*(sides+1)+j;l=k+sides+1;fs.extend([(k,k+1,l),(k+1,l+1,l)])
        surface(vs,uv,fs,kind)
    # Flower-bearing rachis only, starting at the first node; no vegetative stem.
    tiers=6 if lod==1 else 5; sides=6 if lod==1 else 4; rows=3 if lod==1 else 2
    height=.118; vs=[];uv=[];fs=[]
    for i in range(tiers+2):
        t=i/(tiers+1);r=.0018*(1-.78*t)
        for j in range(7):
            th=2*np.pi*(j%6)/6;vs.append([.002*t*t+r*np.cos(th),r*np.sin(th),height*t]);uv.append([j/6,t])
    for i in range(tiers+1):
        for j in range(6):
            k=i*7+j;l=k+7;fs.extend([(k,k+1,l),(k+1,l+1,l)])
    surface(vs,uv,fs,'calyx')
    for i in range(tiers):
        t=i/(tiers-1);z=.009+t*.096; num=4 if i<tiers-2 else 3
        for j in range(num):
            az=2*np.pi*j/num+(i%2)*.78+rng.uniform(-.12,.12);d=np.array([np.cos(az),np.sin(az),.12]); d/=np.linalg.norm(d)
            o=np.array([.002*(z/height)**2,0,z])+d*.0013
            L=(.016-.006*t)*rng.uniform(.92,1.08); w=(.0045-.0016*t)*rng.uniform(.92,1.08)
            bud=i==tiers-1
            ringmesh(o,az,L,w,'calyx',rows,sides,bend=.0018,bud=bud)
            # Persistent colored calyces alternate with open flowers; tip is unopened.
            if not bud and (i>0 or j%2==0):
                p=o+d*L*.65+np.array([0,0,.001])
                ringmesh(p,az,(.024-.008*t)*rng.uniform(.9,1.1),w*.65,'corolla',rows,sides,bend=-.003*(1-t))
    sc=trimesh.Scene()
    for k,ms in parts.items():
        v=[];f=[];u=[];n=[];off=0
        for m in ms:
            normals=m.vertex_normals.copy(); # average normals across the duplicated UV seam
            # positions at first/last vertex in each UV ring are identical.
            for i in range(len(m.vertices)):
                if m.visual.uv[i,0]==0:
                    ix=np.flatnonzero((m.visual.uv[:,0]==1)&np.isclose(m.visual.uv[:,1],m.visual.uv[i,1]))
                    if len(ix)==1:
                        s=normals[i]+normals[ix[0]]; ln=np.linalg.norm(s)
                        if ln: normals[i]=normals[ix[0]]=s/ln
            v.append(m.vertices);f.append(m.faces+off);u.append(m.visual.uv);n.append(normals);off+=len(m.vertices)
        m=trimesh.Trimesh(vertices=np.concatenate(v),faces=np.concatenate(f),vertex_normals=np.concatenate(n),process=False);m.visual=trimesh.visual.TextureVisuals(uv=np.concatenate(u),material=mats[k]);sc.add_geometry(m,geom_name=k,node_name=k)
    sc.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0]));return sc

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--lod',type=int,choices=[1,2],default=1);p.add_argument('--seed',type=int,default=12);p.add_argument('--out',type=Path);a=p.parse_args(); out=a.out or ROOT/'assets'/'salvia'/f'salvia_lod{a.lod}.glb';out.parent.mkdir(parents=True,exist_ok=True);s=build(a.seed,a.lod);s.export(str(out),file_type='glb',include_normals=True,unitize_normals=True);print(out,sum(len(m.faces) for m in s.geometry.values()))
