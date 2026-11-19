# 限定の家具（g_*）の質感（持ち主のたのみ：毎回、質感を入れる）
import os
import oblique3d as O
TX=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','textures')
WOODT=O.Tex(os.path.join(TX,'wood049.png'),span=1.0,flow=8,minrun=3,dark=(0.34,0.82),light=(0.26,1.1))   # 木目
PAPERT=O.Tex(os.path.join(TX,'paper005.png'),span=0.8,flow=2,minrun=2,dark=(0.12,0.95),light=(0.1,1.04))   # 紙のすじ
CLAYT=O.Tex(os.path.join(TX,'plaster001.png'),span=1.0,flow=2,minrun=2,dark=(0.3,0.86),light=(0.22,1.08))   # 素焼きの土のざらつき
def W(p):p.texobj=WOODT;return p
def PA(p):p.texobj=PAPERT;return p
def CL(p):p.texobj=CLAYT;return p
