# くずれた岩の山（tsrubble:lo#1）：組み方は ts_rubble_common.py。
from ts_rubble_common import rubble
from natcommon import SUN
ID='ts_rubble_lo1';GRAD=True;ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('tsrubble:lo#1',0)]
def PARTS():return []
def EXTRA(sc):rubble(sc,4,0)
