# こわれた神殿（statueb）：設計図は temple.py（神殿 statue と同じ3D。右の屋根・右の柱・右のかべ・はりの右はしがくずれた）
from temple import *
ID='statueb';BOTTOM=62;GRAD=True;CONTRAST=1.25;OUTERK=0.66;POUT=0.78   # まわりのふちの輪郭線は、目地のうすい線（olk）にせず、白い石なので、こくする（となりの色×0.66）。粒のコケ・草むらにも輪郭線
VIEWS=[('statueb',0)]
def PARTS():
    L=PARTS_T(True)
    f=P('おちた旗','box',(1.02,0.74,0.30,1.36,0.94,0.312),BAN0,on=('上段5-3',),note='上の段におちた右の旗');f.tex=False;f.soft1=True
    f.decal=lambda x,y,z:STARC0 if math.hypot(x-1.19,(y-0.84)*1.6)<0.05 else GOLD0 if y>0.92 else None;L.append(f)
    return L
def EXTRA(sc):
    """くずれおちた物：おれた柱の上（上の段にたおれている）・その柱頭・石のかけら・ころげおちた水晶"""
    fallen_crystal(sc)
    sc.part();sc.tube([(1.30,0.62,0.30+COLR),(1.62,0.10,0.30+COLR)],COLR,OLD,n=20)   # おれた右の柱の上の部分（上の段の右に、ななめにたおれた）
    sc.part();sc.box(1.44,-0.18,0.30,1.70,0.06,0.48,OLD2)   # その柱頭
    for x,y,z,w,d,h in((-0.55,0.82,0.13,0.18,0.12,0.09),(0.80,0.62,0.30,0.16,0.12,0.08),(1.25,0.84,0.13,0.15,0.10,0.08),(-0.18,0.84,0.13,0.12,0.10,0.07),(0.25,0.58,0.30,0.12,0.10,0.06),(1.20,-0.08,0.30,0.14,0.12,0.09)):
        sc.part();sc.box(x,y,z,x+w,y+d,z+h,OLD2)
def PWATER():return moss(True)   # コケ・つたは粒（pdraw）
