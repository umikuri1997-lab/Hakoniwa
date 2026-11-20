# Quaternius（quaternius.com、CC0）のパックを OpenGameArt からおとして、tools/art/models/quaternius/<短い名前>/ に glb で入れる
# 使い方：python3 tools/art/models/quaternius_fetch.py <一時フォルダ> [短い名前...]（なければ PACKS ぜんぶ）
#   glTF のある物は glTF から（法線などのテクスチャはすて、色のテクスチャは512まで）。ない物は OBJ（MTL の色）から。
#   furniture は MTL の色がぜんぶ灰色なので、材質の名前から、見本の絵（FurniturePreview.png）の色をつける（NAMECOL）。
#   props は、どのモデルも同じ大きなテクスチャを使うので、点ごとの色にうつす（glb ごとにテクスチャを入れると重い）。
#   furniture2 は、色がテクスチャにしかないので、モデルごとのテクスチャの平均の色を、ぜんぶの面につける（TEXOF）。
#   いる物：pip install trimesh
import os,sys,glob,zipfile,urllib.request,urllib.parse,numpy as np,trimesh
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'quaternius')
B='https://opengameart.org/sites/default/files/'
PACKS={'furniture':'Furniture Pack by @Quaternius.zip','furniture2':'Furniture pack Vol.2 by Quaternius.zip',
       'food':'ultimate_food_pack_by_quaternius.zip','props':'fantasy_props_megakitstandard.zip','survival':'survival_pack_-_sept_2020.zip'}
NAMECOL={'Wood':(150,72,56),'DarkWood':(112,54,44),'DarkBrown':(90,50,40),'Sofa':(190,58,58),'Sheets':(240,238,236),'Pages':(238,226,196),
         'Cover2':(92,96,200),'Cover3':(72,150,72),'Cover4':(170,52,52),'Top':(236,222,172),'Metal':(32,40,84),'Vase':(156,204,222),
         'White':(240,240,240),'Green':(110,190,62),'Red':(190,52,52)}
TEXOF={'Chair':'Chair','BigSofa':'Sofa','SmallSofa':'Sofa','BigTable':'Table','Small Table':'Table','CoffeeTable':'Table','Stool':'Table','OldTelevision':'Television'}
def get(u,p):
    if not os.path.exists(p):
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=120);open(p,'wb').write(r.read())
def models(root):
    fs={}
    for dp,_,files in os.walk(root):
        for f in files:
            b,e=os.path.splitext(f);e=e.lower()
            if e=='.gltf' or (e=='.obj' and b not in fs):fs[b]=os.path.join(dp,f)
    return fs
def slimtex(s):
    for m in s.geometry.values():
        mt=getattr(m.visual,'material',None)
        if mt is None:continue
        for k in('normalTexture','metallicRoughnessTexture','occlusionTexture','emissiveTexture'):
            if hasattr(mt,k):setattr(mt,k,None)
        t=getattr(mt,'baseColorTexture',None)
        if t is not None and max(t.size)>512:t.thumbnail((512,512));mt.baseColorTexture=t
def recolor(s,col):
    for m in s.geometry.values():
        m.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=getattr(getattr(m.visual,'material',None),'name',None),baseColorFactor=list(col)+[255]))
def main():
    tmp=sys.argv[1];os.makedirs(tmp,exist_ok=True)
    for k in sys.argv[2:] or PACKS:
        z=os.path.join(tmp,k+'.zip');get(B+urllib.parse.quote(PACKS[k]),z);u=os.path.join(tmp,k)
        if not os.path.isdir(u):zipfile.ZipFile(z).extractall(u)
        pngs={os.path.basename(x):x for x in glob.glob(os.path.join(u,'**','*.png'),recursive=True)}
        for g in glob.glob(os.path.join(u,'**','*.gltf'),recursive=True):   # glTF のとなりにない画像（Textures フォルダにある物）を、となりへ写す
            import json,shutil
            for im in json.load(open(g)).get('images',[]):
                q=os.path.join(os.path.dirname(g),im.get('uri',''))
                if im.get('uri') and not os.path.exists(q) and im['uri'] in pngs:shutil.copy(pngs[im['uri']],q)
        od=os.path.join(OUT,k);os.makedirs(od,exist_ok=True);tex={}
        for p in glob.glob(os.path.join(u,'**','*Texture.png'),recursive=True):
            tex[os.path.basename(p)[:-11]]=tuple(int(c) for c in np.asarray(Image.open(p).convert('RGB'),float).reshape(-1,3).mean(0))
        for name,p in sorted(models(u).items()):
            s=trimesh.load(p,force='scene')
            if k=='furniture':
                for m in s.geometry.values():
                    n=(getattr(getattr(m.visual,'material',None),'name','') or '').split('.')[0]
                    m.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=n,baseColorFactor=list(NAMECOL.get(n,(200,200,200)))+[255]))
            elif k=='furniture2' and name in TEXOF and TEXOF[name] in tex:recolor(s,tex[TEXOF[name]])
            elif k=='props':   # 同じ大きなテクスチャ（トリム）をどのモデルも使うので、点ごとの色にうつして、テクスチャはもたない
                for m in s.geometry.values():
                    try:vc=m.visual.to_color().vertex_colors
                    except Exception:continue
                    m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=vc)
            else:slimtex(s)
            s.export(os.path.join(od,name.replace(' ','_')+'.glb'))
        print(k,len(os.listdir(od)),flush=True)
if __name__=='__main__':main()
