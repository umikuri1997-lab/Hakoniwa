# 水晶のほらあなの、水晶のかべ（cave:ccols のもと。持ち主のたのみで、かべ一面を水晶に）：がけの正面に、高さ・太さ・向きのちがう水晶の柱を、よこにすきまなくならべる。4マスでくりかえす。
# 設計図（単位はマス）：いちばんおくの列（すきまをうめる、ひくめの水晶）・おくの列（1本の水晶。太さ・高さ（0.4〜1.2）・左右のかたむき（±24度）がばらばら。0.25マスごと）と、手前の列（高さ0.4〜0.6の小さなかたまり・細い1本。ところどころ）。
#   水晶は外のフリーのモデル（Kenney「Tower Defense Kit」の detail-crystal、CC0）。ならびはおくは0.25マスごと（seed を16こ）、手前は0.5マスごと（8こ）で、4マスでくりかえす。
#   1本ずつ輪郭線を出し、面ごとに5だんの灰色（natcommon.modelfacets）。ゲームで、こさの番号から階の水晶の色にぬりかえる。
import numpy as np
from natcommon import modelfacets
ID='cave_ccols';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=60;PARALLEL=True;SZ=(8,1)
VIEWS=[('cave_ccols',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
def PARTS():return[]
def EXTRA(sc):
    for i in range(-8,44):   # いちばんおくの列：すきまをうめる、ひくめの水晶（高さ0.55〜0.75、0.25マスごと、少しだけかたむく）
        k=i%16;rs=np.random.RandomState(480+k);x=i*0.25+rs.uniform(-.04,.04)
        modelfacets(sc,'kenney/space/td_crystal.glb',(x,0.22),0.34+rs.uniform(0,.08),PAL,zs=1.7,rot=rs.uniform(0,360),tilt=rs.uniform(-10,10),gi='k%d'%i)
    for i in range(-8,44):
        k=i%16;rs=np.random.RandomState(80+k);x=i*0.25+0.12+rs.uniform(-.04,.04)
        w=rs.uniform(.6,1.4);modelfacets(sc,'kenney/space/td_crystal.glb',(x,0.40),0.30*w+rs.uniform(0,.12),PAL,zs=rs.uniform(1.4,2.8)/w**.5,rot=rs.uniform(0,360),tilt=rs.uniform(-24,24),gi='b%d'%i)
    for i in range(-4,22):
        k=i%8;rs=np.random.RandomState(280+k)
        if rs.uniform()<0.4:continue
        x=i*0.5+rs.uniform(0,.2)
        if rs.uniform()<0.5:modelfacets(sc,'kenney/space/td_crystal_large.glb',(x,0.66),0.32+rs.uniform(0,.15),PAL,zs=1.2,rot=rs.uniform(0,360),gi='f%d'%i)
        else:modelfacets(sc,'kenney/space/td_crystal.glb',(x,0.66),0.2+rs.uniform(0,.12),PAL,zs=2.0,rot=rs.uniform(0,360),gi='f%d'%i)
