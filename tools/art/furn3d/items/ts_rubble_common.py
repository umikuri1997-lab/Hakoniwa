# くずれた岩の山（tsrubble、土のステージ）の共通の組み方：谷のはしの土地をふさぐ、がけからくずれおちた砂岩のかたまり。1マスに1つ置き、となりのマスとかさなって1つの山に見える。
# 設計図（マス。x=東・y=南・z=上。置くマスの左上が(0,0)）
#   岩：角ばった、ひくく平たい砂岩のかたまり（よこにねた板・われたブロック。高さは、はばの0.6まで）を、大きいのから小さいのまで8〜10こ。
#     マスのふちから0.15ほどはみ出して、となりのマスの岩とかさなる（すきまから地面が見えない）。上へつむ岩は、下の岩の上にのせる。
#   山のまん中のマス（hi）は高く（つんだ岩で0.62まで）、ふちのマス（lo）は、ふれあう中くらいの岩4こと、上に1こ（0.30まで）。小石はばらまかない。ゲームは、まん中からの近さで、えらぶ。
#   4つの絵は、岩のならびのちがう物（同じ山をまわすと、光と面の色がずれるので、まわさない）。
#   色：谷のがけの絵と同じ、すなの岩の色（5だん。あなぐまの巣穴と同じ）。面の色は光の向きできまる（hullrock）。
import numpy as np
from natcommon import hullrock
PAL=[(212,178,150),(198,164,138),(182,150,128),(164,134,116),(146,118,102)]
SLAB=((0,1.0,9),(0.55,0.97,8),(1.0,0.78,7))   # 上が平らな、われたブロックの形（とがらない）
def rubble(sc,seed,hi):
    rs=np.random.RandomState(seed);n=0
    if hi:   # 山のまん中：大きなブロック3こ（はば0.6〜0.75）と、その上につんだ岩2こ（高さ0.76まで）
        base=[((0.30,0.34),(0.36,0.30),0.34),((0.76,0.42),(0.34,0.28),0.30),((0.46,0.84),(0.36,0.26),0.28)]
        tops=[((0.44,0.46),(0.30,0.24),0.30,0.32),((0.70,0.70),(0.24,0.20),0.26,0.26),((0.52,0.56),(0.18,0.15),0.56,0.20)]   # 3こめは、2この上に（0.76まで）
    else:    # 山のふち：小さい岩6こと小石
        base=[((0.24,0.26),(0.27,0.22),0.24),((0.76,0.30),(0.25,0.21),0.22),((0.30,0.76),(0.26,0.21),0.20),((0.78,0.80),(0.24,0.20),0.18)]
        tops=[((0.52,0.52),(0.18,0.15),0.16,0.14)]
    for c,r,h in base:
        hullrock(sc,(c[0]+rs.uniform(-0.04,0.04),c[1]+rs.uniform(-0.04,0.04)),(r[0]*rs.uniform(0.9,1.1),r[1]*rs.uniform(0.9,1.1)),h*rs.uniform(0.9,1.1),PAL,seed=seed*31+n,gi='b%d'%n,ring=SLAB);n+=1
    for c,r,z0,h in tops:sc_hull(sc,c,r,z0,h,seed*31+n,'t%d'%n);n+=1
def sc_hull(sc,c,r,z0,h,seed,gi):
    """z0 の高さにのせた、ひくいブロック（hullrock の点を z0 上げる）"""
    import oblique3d as O
    from scipy.spatial import ConvexHull
    rs=np.random.RandomState(seed);P=[]
    for z,k,nn in SLAB:
        for i in range(nn):
            a=2*np.pi*(i+rs.uniform(-0.3,0.3))/nn;rr=k*rs.uniform(0.85,1.08)
            P.append((c[0]+np.cos(a)*r[0]*rr,c[1]+np.sin(a)*r[1]*rr,z0+h*min(1,z*rs.uniform(0.95,1.05))))
    P=np.array(P);H=ConvexHull(P);t=P[H.simplices];c0=P.mean(0)
    nv=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);nv/=np.linalg.norm(nv,axis=1,keepdims=True)+1e-12;nv*=np.sign(((t.mean(1)-c0)*nv).sum(1))[:,None]
    keep=nv[:,2]>-0.5;t,nv=t[keep],nv[keep];d=nv@O.LIGHT;cut=np.quantile(d,np.linspace(1,0,len(PAL)+1)[1:-1])
    sc.texture(None);sc.material('flat');sc.smooth(False);sc.group(gi);sc.part()
    for tt,dd in zip(t,d):sc.tri(tt[0],tt[1],tt[2],PAL[int((dd<cut).sum())])
    sc.group(None);sc.material(None)
