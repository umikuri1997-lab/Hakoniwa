# 限定の家具（トリポ）のモデルを、持ち主の直しのとおりに直す（モデルそのものを直す。UV とテクスチャはそのまま）。
# 使い方：python3 tools/art/models/tripo/gf_edit.py   … gf/base/*.glb（切りわけて、天板を水平にした物）から、直した gf/*.glb を作る（何回やっても同じ）
#   座標は glTF（x 右・y 上・z 手前、足もとが原点）。高さのわりあいは、その家具の高さ h に対する数。
#   ・火のソファ：クッション（サーモン色の点）を、それぞれのまん中で、よこ1.5倍・たて0.75倍
#   ・火・風のびょうぶ：おく行きを0.35倍（ほぼまっすぐ）
#   ・風のベッド・水のソファ：はば1.5倍
#   ・土の花のオブジェ：鉢のふちより上の花・多肉を、それぞれの根もとで1.25倍・まん中から少し外へ（いい感じにならべる）
#   ・水のドレッサー：鏡のわくの中に、鏡の板をたす（色はテクスチャのうすい水色のドット。うつりこみは設計図の uvfix）
import os,numpy as np,trimesh
from PIL import Image
D=os.path.join(os.path.dirname(__file__),'gf');B=os.path.join(D,'base')
tex=np.asarray(Image.open(os.path.join(D,'tex.png')).convert('RGB')).astype(float);TH,TW=tex.shape[:2]
MIRUV=((687+0.5)/TW,1-(131+0.5)/TH)   # テクスチャのうすい水色のドット（鏡の板の色）
def load(n):return trimesh.load(os.path.join(B,n+'.glb'),force='mesh')
def vcol(m):uv=m.visual.uv;return tex[np.clip(((1-uv[:,1]%1)*TH).astype(int),0,TH-1),np.clip(((uv[:,0]%1)*TW).astype(int),0,TW-1)]
def save(n,m):m.export(os.path.join(D,n+'.glb'));print(n,'なおした')
def near(c,ref,tol):return np.abs(c-np.array(ref,float)).sum(1)<tol
def fsofa():
    m=load('g_f_sofa');v=m.vertices;h=v[:,1].max();c=vcol(m)
    sel=near(c,(221,154,107),60)&(np.abs(v[:,0])<0.075)&(v[:,1]>0.28*h)&(v[:,1]<0.75*h)&(v[:,2]<0.06)
    for s in (sel&(v[:,0]<0),sel&(v[:,0]>=0)):
        if s.sum()<5:continue
        o=v[s].mean(0);v[s]=o+(v[s]-o)*[1.5,0.75,1.0]
    m.vertices=v;save('g_f_sofa',m)
def screen(n):
    m=load(n);v=m.vertices;v[:,2]*=0.35;m.vertices=v;save(n,m)   # 0.15 だと、横から見たとき紙のようにうすくなる
def widen(n):
    m=load(n);v=m.vertices;v[:,0]*=1.5;m.vertices=v;save(n,m)
def planter():
    m=load('g_e_planter');v=m.vertices;h=v[:,1].max();c=vcol(m)
    cream=near(c,(222,190,158),70);top=(v[:,1]>0.55*h)&~cream
    from scipy.cluster.vq import kmeans2
    P=v[top][:,[0,2]];k=9;cen,lb=kmeans2(P,k,minit='++',seed=3)
    idx=np.nonzero(top)[0]
    for i in range(k):
        s=idx[lb==i]
        if len(s)<5:continue
        base=np.array([v[s,0].mean(),v[s,1].min(),v[s,2].mean()])
        v[s]=base+(v[s]-base)*1.25
        push=np.array([base[0],0,base[2]])*0.08;v[s]+=push   # まん中から少し外へ（重ならないように）
    m.vertices=v;save('g_e_planter',m)
def vanity():
    m=load('g_s_vanity');v=m.vertices;h=v[:,1].max()
    cx,cy,cz=0.0,0.655*h,-0.165*h;rx,ry=0.165*h,0.215*h;N=48   # 鏡の板（しずくの形のわくの中。うしろの板の少し手前）
    a=np.linspace(0,2*np.pi,N,endpoint=False);ring=np.c_[cx+rx*np.sin(a)*(1-0.25*np.clip(np.cos(a),0,1)),cy+ry*np.cos(a),np.full(N,cz)]
    P=np.vstack([[cx,cy,cz],ring]);F=np.array([[0,1+i,1+(i+1)%N] for i in range(N)])
    mir=trimesh.Trimesh(P,F,process=False);mir.visual=trimesh.visual.TextureVisuals(uv=np.tile(MIRUV,(len(P),1)),material=m.visual.material)
    out=trimesh.util.concatenate([m,mir]);save('g_s_vanity',out)
fsofa();screen('g_f_screen');screen('g_k_screen');widen('g_k_bed');widen('g_s_sofa');planter();vanity()
