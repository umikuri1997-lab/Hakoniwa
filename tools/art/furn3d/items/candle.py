# ろうそく（candle）：いまの絵と同じデザイン・同じ大きさ。真ちゅうの手もちのろうそく立てに、白いろうそくと火。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（36×53ドット）に合わせた）
#   ろうそく立て：真ちゅうの、ふちの立ったまるい皿（半径0.21・高さ0.08）。まん中に、ろうそくをさす台（半径0.09・高さ0.12）。
#   取っ手：皿の右のふちに、たての輪（半径0.07、太さ0.02）。
#   ろうそく：白いろう（半径0.075・高さ0.12〜0.50）。火の光で明るい（かげをつけない）。てっぺんに、しん（0.008）。
#   火：しんの上に、しずくの形（高さ0.17・はば0.10）。光るので、かげをつけず、色のグラデーション（まん中の下は白っぽい黄色・黄色・ふちはだいだい・さきは赤み・根もとに青。common.flame）。
from blueprint import Part as P
from common import *
import math
ID='candle';GRAD=True;BOTTOM=63
VIEWS=[('candle',0)]
CX,CY=0.47,0.62;BRASS=(226,176,96);WAX=(250,244,226);FL=(255,170,70);FLC=(255,236,150)
def MT(p):p.metal=True;return p
def SOFT1(p):p.soft1=True;return p
def GL(p):p.glow=True;p.tex=False;return p
def PARTS():
    L=[MT(P('皿','lathe',(CX,CY,[(0.0,0.0),(0.19,0.0),(0.21,0.035),(0.215,0.08),(0.20,0.08),(0.185,0.035),(0.0,0.035)]),BRASS,detail=32,note='地面におく'))]
    L.append(MT(P('台','lathe',(CX,CY,[(0.0,0.035),(0.095,0.035),(0.09,0.07),(0.08,0.12),(0.0,0.12)]),BRASS,detail=24,on=('皿',),note='皿のまん中')))
    ring=[(CX+0.21+0.07+0.07*math.cos(math.radians(a)),CY,0.08+0.07*math.sin(math.radians(a))) for a in range(180,540+1,30)]
    L.append(MT(P('取っ手','tube',(ring,0.02),BRASS,on=('皿',),note='皿の右のふち')))
    L.append(GL(notex(P('ろうそく','cyl',(CX,CY,0.075,0.12,0.50),WAX,detail=20,on=('台',),note='台にさす'))))
    L.append(notex(P('しん','cyl',(CX,CY,0.01,0.50,0.53),(120,96,80),detail=6,on=('ろうそく',),note='ろうそくのてっぺん')))
    L.append(flame('火',CX,CY,0.515,0.17,0.05,('しん',),'しんの上。光る'))
    return L
