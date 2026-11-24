# くずれた岩の山（tsrubble:lo#2）：組み方は ts_rubble_common.py。
from ts_rubble_common import rubble
from natcommon import SUN
ID='ts_rubble_lo2';GRAD=True;ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('tsrubble:lo#2',0)]
def PARTS():return []
def EXTRA(sc):rubble(sc,5,0)
