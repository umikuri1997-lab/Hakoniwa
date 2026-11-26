"""3Dの試作（proto3d）の小物・岩：トリポのモデル（tools/art/models/tripo）を UV 展開（xatlas）して、tex/props.glb にする。
  python3 proto3d/make_uv.py
UV の長さは、モデルの長さと同じ単位（面積が3Dと同じ）。試作は、それを材質の絵1まいのマス（span）でわって、絵をくりかえしてはる（main.js）。
はる絵（材質）は main.js の PROPS の mat。"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glbio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDS = ['rock', 'stone_big', 'lantern', 'sack', 'firewood', 'stump', 'log_lying', 'jar_band', 'wateringcan']

if __name__ == '__main__':
    out = []
    for k in IDS:
        att, idx = glbio.read(os.path.join(ROOT, 'tools', 'art', 'models', 'tripo', k+'.glb')); P = att['POSITION']
        vm, ni, uv = glbio.unwrap(P, idx)
        A = {'POSITION': P[vm], 'TEXCOORD_0': uv}
        if 'COLOR_0' in att: A['COLOR_0'] = att['COLOR_0'][vm]
        out.append((k, A, ni)); print(k, len(idx), '→', len(ni), '三角形', len(vm), '点')
    glbio.write(out, os.path.join(ROOT, 'proto3d', 'tex', 'props.glb'), 'proto3d/make_uv.py')
