# くずれた岩の山（tsrubble:hi#0）：組み方は ts_rubble_common.py。
from ts_rubble_common import rubble
from natcommon import SUN
ID='ts_rubble_hi0';GRAD=True;ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('tsrubble:hi#0',0)]
def PARTS():return []
def EXTRA(sc):rubble(sc,13,1)
