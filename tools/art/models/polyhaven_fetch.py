# Poly Haven（polyhaven.com、CC0）のモデルをおとして、tools/art/models/polyhaven に glb で入れる
# 使い方：python3 tools/art/models/polyhaven_fetch.py <おとす一時フォルダ> [名前...]（名前がなければ LIST）
#   1k の glTF をおとし、色のテクスチャだけのこす（法線・ARM はすて、512 にちぢめる）。
#   面が SLIM より多い物（岩・切り株など）は、テクスチャの色を点ごとの色にうつしてから、面を SLIM までへらす。
#   いる物：pip install trimesh fast_simplification scipy
import os,sys,json,urllib.request,numpy as np,trimesh
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'polyhaven');SLIM=20000
LIST=['rock_moss_set_01','rock_moss_set_02','boulder_01','namaqualand_boulder_02','tree_stump_01','tree_stump_02',
 'WoodenChair_01','painted_wooden_chair_01','painted_wooden_chair_02','Rockingchair_01','painted_wooden_sofa','painted_wooden_bench',
 'folding_wooden_stool','wooden_stool_01','wooden_stool_02','painted_wooden_stool','WoodenTable_01','WoodenTable_03',
 'round_wooden_table_01','round_wooden_table_02','painted_wooden_table','wooden_picnic_table','painted_wooden_nightstand',
 'painted_wooden_cabinet','painted_wooden_shelves','wooden_bookshelf_worn','wooden_display_shelves_01','vintage_wooden_drawer_01',
 'Barrel_01','wooden_bucket_01','wooden_crate_01','wicker_basket_01','treasure_chest','planter_box_01','wooden_lantern_01','wooden_candlestick']
def get(u):return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'hakoniwa-asset-fetch/1.0'}),timeout=60).read()   # UA がないと 403
def fetch(dl,a):
    d=os.path.join(dl,a);os.makedirs(d,exist_ok=True)
    f=json.loads(get('https://api.polyhaven.com/files/'+a))['gltf']['1k']['gltf'];g=os.path.join(d,os.path.basename(f['url']))
    if not os.path.exists(g):
        open(g,'wb').write(get(f['url']))
        for rel,inc in f.get('include',{}).items():
            p=os.path.join(d,rel);os.makedirs(os.path.dirname(p),exist_ok=True);open(p,'wb').write(get(inc['url']))
    return trimesh.load(g,force='scene')
def slim(s):
    import fast_simplification as fs;from scipy.spatial import cKDTree
    tot=sum(len(m.faces) for m in s.geometry.values());parts=[]
    for node in s.graph.nodes_geometry:
        T,gn=s.graph[node];m=s.geometry[gn].copy();m.apply_transform(T)
        vc=np.asarray(m.visual.to_color().vertex_colors)[:,:3].astype(float);V=np.asarray(m.vertices);F=np.asarray(m.faces)
        V2,F2=fs.simplify(V.astype(np.float32),F.astype(np.int32),target_reduction=1-SLIM/tot)
        _,i=cKDTree(V).query(V2,k=4);c=vc[i].mean(1)
        mm=trimesh.Trimesh(V2,F2,process=False);mm.visual=trimesh.visual.ColorVisuals(mm,vertex_colors=np.c_[c,np.full(len(c),255)].astype(np.uint8));parts.append(mm)
    return trimesh.util.concatenate(parts)
def main():
    dl=sys.argv[1];os.makedirs(OUT,exist_ok=True)
    for a in sys.argv[2:] or LIST:
        s=fetch(dl,a)
        if sum(len(m.faces) for m in s.geometry.values())>SLIM:s=slim(s)
        else:
            for m in s.geometry.values():
                mt=getattr(m.visual,'material',None)
                if mt is None:continue
                for k in('normalTexture','metallicRoughnessTexture','occlusionTexture','emissiveTexture'):
                    if hasattr(mt,k):setattr(mt,k,None)
                t=getattr(mt,'baseColorTexture',None)
                if t is not None and max(t.size)>512:mt.baseColorTexture=t.resize((512,512))
        s.export(os.path.join(OUT,a+'.glb'));print(a,flush=True)
if __name__=='__main__':main()
