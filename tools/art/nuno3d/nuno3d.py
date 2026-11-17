"""布（nuno）の素材アイコン：たたんだ布1まいを3Dに組んで、ドット絵に写す（スキル model3d-pixel、見え方は家具と同じ furn3d.shot）。
設計図（単位はマス。アイコンは、ほかの素材と同じく、はば32ドットくらいのドットを3倍にのばす）
  1まいの布を3つにたたんだ形。重ねごとに、あつさ0.04。角も上下のふちも丸い（布の loft、common.soft）。
  下の重ね：はば0.46・おく0.32。地面におく。
  まん中の重ね：うしろのふちで折りかえした布。はば0.448・うしろのはしは0.03手前。下の重ねの上にのせる。
  上の重ね：手前のふちで折りかえした布。はば0.436・うしろのはしは0.06手前。まん中の重ねの上にのせる。ぬい目は入れない（持ち主がきめた）。
  色は、きなり（生成り）。布の織り目は CC0 の Fabric026（tools/art/textures）。
  python3 tools/art/nuno3d/nuno3d.py <出力フォルダ>            # 絵（nuno.png・nuno_x10.png）を書き出す
  python3 tools/art/nuno3d/nuno3d.py <出力フォルダ> --icon     # assets/g に入れ、js/draw-spirits.js の ICONS に書く"""
import sys,os,io,re,hashlib
D=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(D,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(ART,'furn3d'));sys.path.insert(0,os.path.join(ART,'furn3d','items'))
from PIL import Image
import oblique3d as O
import furn3d as F
from blueprint import Part as P
from common import soft
KINARI=(240,228,198)   # きなり（生成り）
TEX=O.Tex(os.path.join(ART,'textures','fabric026.png'),span=0.5,flow=2,minrun=2,dark=(0.10,0.96),light=(0.08,1.03))
W,DP,T=0.46,0.32,0.04
def cloth(nm,x0,y0,x1,y1,z0,z1,on,note,re):
    p=P(nm,'loft',soft(x0,y0,x1,y1,z0,z1,0.05,re,n=7,bulge=0.006),KINARI,on=on,note=note);p.texobj=TEX;p.soft=True;return p
class M:
    GRAD=True;TONE5=True;BOTTOM=0
    @staticmethod
    def PARTS():
        L=[cloth('下の重ね',0,0,W,DP,0,T,(),'地面におく',re=0.022),
           cloth('まん中の重ね',0.006,0.03,W-0.006,DP-0.002,T-0.004,2*T-0.004,('下の重ね',),'うしろのふちで折りかえす',re=0.024),
           cloth('上の重ね',0.012,0.06,W-0.012,DP-0.004,2*T-0.008,3*T-0.008,('まん中の重ね',),'手前のふちで折りかえす',re=0.026)]
        return L
def render():
    O.GRAD=True;im=F.shot(M,0)[0];return im.crop(im.getbbox())
def icon(im):
    im=im.resize((im.width*3,im.height*3),Image.NEAREST);b=io.BytesIO();im.save(b,'WEBP',lossless=True,exact=True);data=b.getvalue()
    name='assets/g/'+hashlib.sha1(data).hexdigest()[:10]+'.webp';open(os.path.join(ROOT,name),'wb').write(data)
    js=os.path.join(ROOT,'js','draw-spirits.js');s=open(js,encoding='utf-8').read()
    m=re.search(r"nuno:'assets/g/[0-9a-f]+\.webp'",s)
    s=s[:m.start()]+"nuno:'%s'"%name+s[m.end():] if m else s.replace("const ICONS={","const ICONS={nuno:'%s',"%name,1)
    open(js,'w',encoding='utf-8').write(s);print('アイコン',name,im.size)
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True);im=render();im.save(os.path.join(out,'nuno.png'))
    im.resize((im.width*10,im.height*10),Image.NEAREST).save(os.path.join(out,'nuno_x10.png'));print('nuno',im.size)
    if '--icon' in sys.argv:icon(im)
