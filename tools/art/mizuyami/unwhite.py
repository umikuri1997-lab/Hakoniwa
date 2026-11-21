#!/usr/bin/env python3
"""もらった白い背景の絵（sheet19.webp）を、すけた背景の絵（sheet19.png）にする。
まわりからつながる、ほぼ白い所を背景にし、物のふち（背景のとなり2ドット）は、白とまざった分をはずして、うすさにする。"""
import os, numpy as np
from PIL import Image
from scipy import ndimage
H = os.path.dirname(os.path.abspath(__file__))
im = np.array(Image.open(os.path.join(H, 'sheet19.webp')).convert('RGB')).astype(float)
d = (254 - im).max(-1)
lab, _ = ndimage.label(d <= 7)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(edge))
near = ndimage.binary_dilation(bg, iterations=2) & ~bg
a = np.ones(d.shape); a[bg] = 0
a[near] = np.clip(d[near] / 40, 0, 1)
c = im.copy(); m = near & (a > 0)
c[m] = np.clip((im[m] - (1 - a[m, None]) * 254) / a[m, None], 0, 255)
out = np.dstack([c, a * 255]).round().astype(np.uint8)
Image.fromarray(out, 'RGBA').save(os.path.join(H, 'sheet19.png'))
print('ok')
