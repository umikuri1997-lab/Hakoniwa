"""3Dの試作（proto3d）の道具でつかう、かんたんな glb の読み書き（メッシュ1つ・三角形・番号つき）。"""
import json, struct
import numpy as np

CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read(path):
    """いちばんはじめのメッシュの {属性名: 配列}・三角形の番号 [n,3]。色（COLOR_0）は 0〜1 の linear にする"""
    b = open(path, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20+l]); bn = b[20+l+8:]
    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; n = NC[a['type']]; dt = CT[a['componentType']]
        o = bv.get('byteOffset', 0)+a.get('byteOffset', 0); assert not bv.get('byteStride') or bv['byteStride'] == n*np.dtype(dt).itemsize   # つめてならんだ物だけ
        r = np.frombuffer(bn, dt, a['count']*n, o).reshape(-1, n).astype(float)
        if a.get('normalized'): r /= np.iinfo(dt).max
        return r
    p = j['meshes'][0]['primitives'][0]; att = {k: acc(v) for k, v in p['attributes'].items()}
    idx = acc(p['indices']).reshape(-1, 3).astype(int) if 'indices' in p else np.arange(len(att['POSITION'])).reshape(-1, 3)
    if 'COLOR_0' in att: att['COLOR_0'] = att['COLOR_0'][:, :3]
    return att, idx


def write(meshes, path, generator):
    """meshes：[(名前, {属性名: 配列 [n,k]}, 三角形の番号 [m,3])] を、メッシュごとのノードにして書く"""
    bins = b''; acc = []; views = []; ms = []; nodes = []
    def add(arr, ct=5126):
        nonlocal bins
        arr = np.asarray(arr); arr = arr.reshape(len(arr), -1) if arr.ndim > 1 else arr
        data = np.ascontiguousarray(arr, CT[ct]).tobytes(); views.append({'buffer': 0, 'byteOffset': len(bins), 'byteLength': len(data)}); bins += data
        k = 1 if arr.ndim == 1 else arr.shape[1]; a = {'bufferView': len(views)-1, 'componentType': ct, 'count': int(len(arr)), 'type': {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4'}[k]}
        if ct == 5126 and arr.ndim > 1: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
        acc.append(a); return len(acc)-1
    for name, att, idx in meshes:
        A = {k: add(v) for k, v in att.items()}; ii = add(np.asarray(idx).ravel(), 5125)
        ms.append({'name': name, 'primitives': [{'attributes': A, 'indices': ii}]}); nodes.append({'name': name, 'mesh': len(ms)-1})
    j = {'asset': {'version': '2.0', 'generator': generator}, 'scene': 0, 'scenes': [{'nodes': list(range(len(nodes)))}],
         'nodes': nodes, 'meshes': ms, 'accessors': acc, 'bufferViews': views, 'buffers': [{'byteLength': len(bins)}]}
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' '*((4-len(js) % 4) % 4); bins += b'\0'*((4-len(bins) % 4) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12+8+len(js)+8+len(bins)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js); f.write(struct.pack('<II', len(bins), 0x004E4942)); f.write(bins)


def unwrap(P, idx):
    """UV 展開（xatlas）。かえす物：点のもとの番号・新しい三角形の番号・UV（モデルの長さの単位。面積が3Dと同じになるように）"""
    import xatlas
    vm, ni, uv = xatlas.parametrize(np.asarray(P, np.float32), np.asarray(idx, np.uint32))
    t3 = P[vm][ni]; t2 = uv[ni]
    a3 = np.linalg.norm(np.cross(t3[:, 1]-t3[:, 0], t3[:, 2]-t3[:, 0]), axis=1).sum()
    e1, e2 = t2[:, 1]-t2[:, 0], t2[:, 2]-t2[:, 0]; a2 = np.abs(e1[:, 0]*e2[:, 1]-e1[:, 1]*e2[:, 0]).sum()
    return vm, ni, uv*np.sqrt(a3/max(a2, 1e-12))
