# りんごの木の実のあるとき（fruit#mi）：草原の木（nat_tree.py）と同じ木に、りんご（赤い玉）を6こ（natcommon.apples）。お手本の、りんごの木の絵。
from natcommon import nat,flat,leafballs,post_clean,barktexdecal,apples
import nat_tree as T
ID='fruit#mi';GRAD=False;SHADE=T.SHADE;ELEV=T.ELEV;WIDE=T.WIDE;BOTTOM=T.BOTTOM
VIEWS=[('fruit#mi',0)]
POST=post_clean
PARTS=T.PARTS
def EXTRA(sc):T.EXTRA(sc);apples(sc,'nat_tree.glb',T.H,WIDE,6,(226,74,62),r=0.085)
