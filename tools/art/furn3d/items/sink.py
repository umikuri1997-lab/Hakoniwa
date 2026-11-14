# 流し台（sink）：いまの絵と同じデザイン・同じ大きさ。石のブロックをつんだ四角い水ため。おくに真ちゅうのじゃぐち。中に水。前・右・後ろ・左の4つの向き。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（62×56ドット）に合わせた）
#   底石：かべの内がわの地面に、1まいの石（高さ0〜0.10）。
#   かべ：石のブロックを2だんつむ（1だん0.15、あつさ0.12、全体の高さ0.30）。前とうしろは1だんに3つ、左右は2つ。
#     2だんめは、つぎ目が1だんめとかさならないように、半分ずらしてつむ（かどは、前うしろのかべの石が左右のかべの上をおおう）。
#   じゃぐち：真ちゅう。うしろのかべの上（左より、x 0.38）に台、たての管（高さ0.32〜0.42）、手前へまがる首と、下を向く口。管の上にハンドル。
#   水：中、ふちの0.11下。すけて見える・つやがある（'clear'）。
#   石の色は、あたたかい明るい灰色（STONE）。石の面には、石のテクスチャ（ambientCG Rock030）。
from blueprint import Part as P
from common import *
import math
ID='sink';BOTTOM=43
VIEWS=[('sink',0),('sink>1',1),('sink>2',2)]   # 前・右・後ろ（左は右の反転）
X0,X1,Y0,Y1=0.03,0.97,0.28,0.90;T=0.12;CH=0.15;STONE=(208,194,186);BRASS=(222,170,92)
WATER=(120,192,236);SKY=(220,240,252)
def MT(p):p.metal=True;return p
def ST(p):p.stone=True;return p
def PARTS():
    L=[ST(P('底石','box',(X0+T,Y0+T,0,X1-T,Y1-T,0.10),STONE,bevel=0,note='地面'))]
    for c in range(2):
        z0,z1=c*CH,(c+1)*CH;on=('ground',) if c==0 else tuple('石%d-%d'%(0,k) for k in range(10))
        # 前とうしろ：1だんめは3つ（はばは同じ）。2だんめは半分ずらす（はしは半分の石）
        W=X1-X0;cuts=[X0+W*k/3 for k in range(4)] if c==0 else [X0,X0+W/6,X0+W/2,X0+W*5/6,X1]
        k=0
        for wy0,wy1,nm in((Y0,Y0+T,'うしろ'),(Y1-T,Y1,'前')):
            for a,b in zip(cuts,cuts[1:]):L.append(ST(P('石%d-%d'%(c,k),'box',(a+0.003,wy0,z0+0.003,b-0.003,wy1,z1),STONE,on=on if c==0 else ('石0-0','石0-1','石0-2','石0-3','石0-4','石0-5'),bevel=0.012,note='%sのかべ'%nm)));k+=1
        ys=[Y0+T,(Y0+Y1)/2,Y1-T] if c==0 else [Y0+T,Y1-T]
        for wx0,wx1,nm in((X0,X0+T,'左'),(X1-T,X1,'右')):
            for a,b in zip(ys,ys[1:]):L.append(ST(P('石%d-%d'%(c,k),'box',(wx0,a+0.003,z0+0.003,wx1,b-0.003,z1),STONE,on=on if c==0 else ('石0-6','石0-7','石0-8','石0-9'),bevel=0.012,note='%sのかべ'%nm)));k+=1
    xf=0.38;yf=Y0+T/2;ze=2*CH   # じゃぐち：うしろのかべの上（左よりのところ）に台をつけ、首をまげて、口を水ための上へ
    L.append(MT(P('じゃぐちの台','cyl',(xf,yf,0.03,ze,ze+0.02),BRASS,detail=12,on=('石1-1',),note='うしろのかべの上にとめる')))
    L.append(MT(P('じゃぐちの管','cyl',(xf,yf,0.02,ze+0.02,ze+0.12),BRASS,detail=10,on=('じゃぐちの台',),note='台の上にたてる')))
    L.append(MT(P('じゃぐちの首','beam',((xf,yf,ze+0.11),(xf,yf+0.11,ze+0.09),0.018),BRASS,on=('じゃぐちの管',),note='管の上から手前へ')))
    L.append(MT(P('じゃぐちの口','beam',((xf,yf+0.11,ze+0.095),(xf,yf+0.12,ze+0.04),0.016),BRASS,on=('じゃぐちの首',),note='首のさきから下へ')))
    L.append(MT(P('ハンドル','ball',(xf,yf,ze+0.14,0.022),BRASS,on=('じゃぐちの管',),note='管の上')))
    return L
def EXTRA(sc):
    zw=0.19;a0,a1,b0,b1=X0+T-0.01,X1-T+0.01,Y0+T-0.01,Y1-T+0.01
    def col(x,y):t=max(0,min(1,(b0+(b1-b0)*0.6-y)/((b1-b0)*0.8)))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    top=lambda x,y:zw+0.004*math.sin(x*23+y*7)+0.003*math.sin(y*31-x*9)
    sc.material('clear');hfield(sc,a0,b0,a1,b1,top,col,n=(36,28));sc.material(None)
