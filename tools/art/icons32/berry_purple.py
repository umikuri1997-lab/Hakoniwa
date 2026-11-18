#!/usr/bin/env python3
"""ベリーのアイコン（もちもの・マップの茂みの実）の赤い実を、紫にする。葉・へたの茶色はそのまま。
使い方：python3 tools/art/icons32/berry_purple.py <もとの絵> <出力>
実の色（色あい 320度より上か 8度より下・あざやかさ0.4より上）だけ、色あいを HUE 度にする。明るさはそのまま、あざやかさは SAT 倍。"""
import sys,colorsys
import numpy as np
from PIL import Image
HUE=280;SAT=0.68   # 紫の色あいと、あざやかさ（明るくやわらかい色に）
im=Image.open(sys.argv[1]).convert('RGBA');a=np.asarray(im).copy()
for y in range(a.shape[0]):
    for x in range(a.shape[1]):
        r,g,b,al=a[y,x]
        if al==0:continue
        h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
        if s>0.4 and (h*360>320 or h*360<8):
            r2,g2,b2=colorsys.hsv_to_rgb(HUE/360,s*SAT,v);a[y,x,:3]=[round(r2*255),round(g2*255),round(b2*255)]
Image.fromarray(a,'RGBA').save(sys.argv[2],lossless=True,exact=True)
