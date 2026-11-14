# 神殿（statue）：設計図は temple.py（こわれた神殿 statueb と同じ3D）
from temple import *
ID='statue';BOTTOM=62;GRAD=True;CONTRAST=1.25;OUTERK=0.66;POUT=0.78   # まわりのふちの輪郭線は、目地のうすい線（olk）にせず、白い石なので、こくする（となりの色×0.66）。粒のコケ・草むらにも輪郭線
VIEWS=[('statue',0)]
def PARTS():return PARTS_T(False)
def EXTRA(sc):stars(sc)
def PWATER():return moss(False)   # コケ・つたは粒（pdraw）
