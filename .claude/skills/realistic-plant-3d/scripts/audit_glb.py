"""Independent lightweight GLB inspection; not Khronos conformance or visual QA.
python audit_glb.py model.glb --report report.json [--max-triangles N] [--require-uv]
"""
import argparse, json, struct, sys
from pathlib import Path
import numpy as np
import trimesh


def audit(path, require_uv=False, max_triangles=None, require_images=False):
    data=Path(path).read_bytes()
    magic,version,length=struct.unpack_from('<4sII',data)
    if (magic,version,length)!=(b'glTF',2,len(data)):
        raise ValueError('invalid GLB header')
    size,typ=struct.unpack_from('<I4s',data,12)
    if typ!=b'JSON' or 20+size>len(data): raise ValueError('invalid JSON chunk')
    doc=json.loads(data[20:20+size]); errors=[]; warnings=[]
    def check(cond,msg):
        if not cond: errors.append(msg)
    acc=doc.get('accessors',[]); mats=doc.get('materials',[])
    for mi,m in enumerate(doc.get('meshes',[])):
        for pi,p in enumerate(m.get('primitives',[])):
            name=f'mesh {mi} primitive {pi}'; a=p.get('attributes',{})
            check('POSITION' in a,f'{name}: no POSITION')
            check('NORMAL' in a,f'{name}: no NORMAL')
            if 'POSITION' in a:
                for k,i in a.items(): check(acc[i]['count']==acc[a['POSITION']]['count'],f'{name}: {k} count mismatch')
            mat=mats[p['material']] if 'material' in p else {}
            pm=mat.get('pbrMetallicRoughness',{})
            tex=[x for x in (pm.get('baseColorTexture'),pm.get('metallicRoughnessTexture'),mat.get('normalTexture'),mat.get('occlusionTexture'),mat.get('emissiveTexture')) if x]
            if require_uv: check('TEXCOORD_0' in a,f'{name}: UV0 missing')
            for t in tex: check(f"TEXCOORD_{t.get('texCoord',0)}" in a,f'{name}: texture UV missing')
            if p.get('mode',4)!=4: warnings.append(f'{name}: non-triangle mode; triangle count reflects imported scene')
    if require_images: check(bool(doc.get('images')), 'no embedded images: texture application required')
    for i,img in enumerate(doc.get('images',[])):
        check('bufferView' in img or img.get('uri','').startswith('data:'),f'image {i}: external dependency')
    for i,b in enumerate(doc.get('buffers',[])):
        check('uri' not in b or b['uri'].startswith('data:'),f'buffer {i}: external dependency')
    s=trimesh.load(path,force='scene',process=False)
    check(bool(s.geometry),'empty scene')
    stats=[]; tri=0
    for n in s.graph.nodes_geometry:
        transform,g=s.graph[n]; m=s.geometry[g]; count=len(m.faces); tri+=count
        check(np.isfinite(transform).all() and np.isfinite(m.vertices).all(),f'{n}: nonfinite geometry')
        check(count>0 and np.all(m.area_faces>1e-14),f'{n}: degenerate/empty faces')
        stats.append({'node':str(n),'triangles':count})
    if max_triangles is not None: check(tri<=max_triangles,f'triangle budget exceeded: {tri}>{max_triangles}')
    bounds=s.bounds.tolist() if len(s.geometry) else None
    return {'file':str(path),'status':'pass' if not errors else 'fail','errors':errors,'warnings':warnings,'triangles_instanced':tri,'mesh_nodes':len(stats),'materials':len(mats),'images':len(doc.get('images',[])),'bounds_y_up':bounds,'nodes':stats,'not_checked':['render appearance','botanical accuracy','self intersections','full glTF conformance','actual draw calls','normal values and winding correctness']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('path');p.add_argument('--report');p.add_argument('--max-triangles',type=int);p.add_argument('--require-uv',action='store_true');p.add_argument('--require-images',action='store_true');a=p.parse_args()
    try: result=audit(a.path,a.require_uv,a.max_triangles,a.require_images)
    except Exception as e: result={'status':'fail','errors':[str(e)]}
    text=json.dumps(result,ensure_ascii=False,indent=2)
    if a.report: Path(a.report).write_text(text,encoding='utf-8')
    else: print(text)
    sys.exit(result['status']!='pass')
