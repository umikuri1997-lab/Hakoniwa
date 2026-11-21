"""トモリとツキミの頭巾・しっぽ・胸飾り。座標はチップのドット。

顔・耳の位置と体、手足の形、骨は水の精霊と同じ。
トモリは金色の頭巾、七つの光、胸のしずく。ツキミは紫のナイトキャップ、
肩にかかる布と胸の三日月。ナイトキャップの白い折り返しは、額で高さ
約60ドット、うなじで約34ドット。幅10〜13ドットの帯で頭を囲み、
その上辺に紫の布をつなぐ。布は右後ろに垂れ、先端で房をとめる。
"""
from math import pi
import numpy as np
from scipy.interpolate import PchipInterpolator

from core import Q, QH, TAILBASE, Spirit, ry

LIGHT = {
    'hood': '#ffdc75', 'dark': '#eeb75d', 'cheek': '#fff0ba',
    'eye': '#3f5e26', 'hand': '#fff3d5', 'line': '#edcf92',
}
DARK = {
    'hood': '#645578', 'dark': '#40374e', 'cheek': '#81738f',
    'eye': '#f2e1f5', 'hand': '#554963', 'line': '#40354e',
}


def rgb(value):
    return tuple(bytes.fromhex(value.lstrip('#')))


def tones(low, high, amount):
    a = np.asarray(amount)[:, None]
    return np.rint(np.array(low)*(1-a)+np.array(high)*a).astype(np.uint8)


def surface(rows):
    """水平断面の中心と半径 (z,x,y,rx,ry) をつないで丸い布にする。"""
    z, x, y, ux, uy = np.asarray(rows).T
    ceiling = np.arange(z[0], z[-1]+QH/2, QH)
    theta = np.arange(0, 2*pi, 2*pi/512)
    cosines, sines = np.cos(theta), np.sin(theta)
    g = []
    for h in ceiling:
        cx, cy, rx, ry = (np.interp(h, z, v) for v in (x,y,ux,uy))
        g.append(np.column_stack((cx+rx*cosines, cy+ry*sines,
                                  np.full(len(theta),h))))
    return np.concatenate(g)


def volume(center, radii, angle=0):
    """光の粒・房の表面。しずくの長い軸は頭の中心から外へ向く。"""
    theta = np.linspace(0, 2*pi, 112, endpoint=False)
    phi = np.linspace(0, pi, 49)
    t, p = np.meshgrid(theta, phi)
    points = np.column_stack((np.cos(t).ravel()*np.sin(p).ravel(),
                              np.sin(t).ravel()*np.sin(p).ravel(),
                              np.cos(p).ravel()))
    return (points*np.array(radii))@ry(angle).T+center


def texture(points, colors):
    return points, (colors,colors,colors)


def chest_mark(body, dark):
    # 体の表面のいちばん前の点に飾りをのせる。
    points = body[body[:,1]>0]
    layers = {}
    for p in points:
        key = float(p[0]),float(p[2])
        if key not in layers or p[1]>layers[key][1]:
            layers[key] = p
    surface_points = np.array(list(layers.values()))
    x,y,z=surface_points.T
    if dark:
        outer = (x/5.2)**2+((z-20)/5.8)**2 <= 1
        inner = ((x-2.55)/4.35)**2+((z-21)/4.72)**2 <= 1
        mask = outer & ~inner
        pigment = np.tile(rgb('#e8d5ed'),(mask.sum(),1))
    else:
        depth = (z-19)/6.3
        mask = np.abs(x)/5.1+np.abs(depth) <= 1
        pigment = tones(rgb('#ecad48'),rgb('#fff2ad'),
                        np.clip(.58+.45*depth[mask]-.10*x[mask],0,1))
    at = surface_points[mask].copy()
    at[:,1] += .32
    return at,pigment


def cuff_height(front):
    return 46.5+13*np.maximum(front,0)**1.37-12.5*np.maximum(-front,0)**1.45


def night_cap():
    """折り返しの上辺から、垂れた先まで断面をつないだ布の帽子。"""
    theta = np.linspace(0,2*pi,640,endpoint=False)
    dx,dy = np.cos(theta),np.sin(theta)
    low = cuff_height(dy)
    back = np.maximum(-dy,0)
    width = 10.2+2.8*back
    # 後頭部のふくらみを越えて、うなじへ向かう厚みのある帯。
    rim_x = -.7+dx*(30.7+2.2*(1-np.maximum(dy,0)))
    rim_y = -5+dy*(24.8+6.6*back)
    t = np.linspace(0,1,27)[:,None]
    roll = np.sin(pi*t)
    cuff = np.stack((rim_x+1.55*dx*roll,rim_y+1.6*dy*roll,
                     low+width*t),axis=-1).reshape(-1,3)
    cuff_colors = tones(rgb('#d4c8df'),rgb('#faf4f8'),
                        np.clip(.55+.016*(t*width).ravel()
                                -.008*cuff[:,0]+.004*cuff[:,1],0,1))

    # 軸は上から右うしろへ曲がり、房のつく先へ下がる。
    rows = np.array([
        (0, 0,-5,58.7,29.7,24.8),
        (.18,1,-6,68,28.5,23.8),
        (.36,7,-9,78,24,20),
        (.53,17,-14,85,17.5,15),
        (.67,28,-19,85.5,12,12),
        (.80,36,-24,80,8,9),
        (.91,41,-27,71,5,6),
        (1,43,-29,63,2.5,3.5),
    ])
    u = np.linspace(0,1,336)
    result = PchipInterpolator(rows[:,0],rows[:,1:],axis=0)(u)
    center,radii = result[:,:3],result[:,3:]
    forward = np.gradient(center,axis=0)
    forward /= np.linalg.norm(forward,axis=1,keepdims=True)
    side = np.cross(np.broadcast_to((0,1.,0),forward.shape),forward)
    side /= np.linalg.norm(side,axis=1,keepdims=True)
    depth = np.cross(forward,side)
    fabric = (center[:,None,:]+dx[None,:,None]*radii[:,0,None,None]*side[:,None,:]
              +dy[None,:,None]*radii[:,1,None,None]*depth[:,None,:])
    # 根もとは折り返しと辺を共有し、上へ行く間に布の丸みへつなぐ。
    rim = np.stack((rim_x,rim_y,low+width),axis=1)
    weight = np.clip(1-u/.24,0,1)**2
    fabric += weight[:,None,None]*(rim-fabric[0])[None,:,:]
    p = fabric.reshape(-1,3)
    pigment = tones(rgb('#483d59'),rgb('#766583'),
                    np.clip(.53+.005*(p[:,2]-72)-.005*p[:,0]+.007*p[:,1],0,1))
    cloth = np.concatenate((cuff,p))
    colors = np.concatenate((cuff_colors,pigment))
    # 斜めから写しても布に点のすきまができないよう、細かい間隔で点をまとめる。
    pitch = QH/2
    grid = np.rint(cloth/pitch).astype(np.int16)
    vertices,first = np.unique(grid,axis=0,return_index=True)
    return texture(vertices.astype(float)*pitch,colors[first])


def mantle():
    """左右の肩から伸びて、先へ行くほど下がる短い外套。"""
    u,v = np.meshgrid(np.linspace(0,1,100),np.linspace(0,1,55),indexing='ij')
    u,v = u.ravel(),v.ravel()
    x = 7+24*u
    top = 30-10*u
    bottom = 22-12*u+6*u**3
    z = top*(1-v)+bottom*v
    y = (7.2-3.5*u)*np.cos(pi*v)+2*u
    right = np.column_stack((x,y,z))
    left = right*np.array([-1,1,1])
    points = np.concatenate((right,left))
    shade = np.clip(.64+.017*(points[:,2]-21)-.007*points[:,0],0,1)
    return points,tones(rgb('#695879'),rgb('#9683a3'),shade)


class LightDark(Spirit):
    def __init__(self, element):
        if element not in ('light','dark'):
            raise ValueError(element)
        super().__init__('water')
        self.el = element
        self.E = f'sp_{element}:'
        self.tops = []
        self.desc = DARK if element=='dark' else LIGHT
        self.hand = rgb(self.desc['hand'])
        self.line = rgb(self.desc['line'])
        dark = element=='dark'
        if dark:
            self.body_color = rgb('#504560')
            self.arm_color = rgb('#847392')
            self.far_leg_color = rgb('#463d55')
            self.cape = mantle()
        else:
            self.body_color = rgb('#fff7e3')
            self.arm_color = rgb('#fff7e3')
            self.far_leg_color = rgb('#f4e5c6')
        self.chest = chest_mark(self.solid['body'],dark)
        self.hood(dark)
        self.tail = self.make_tail(dark)

    def hood(self, dark):
        original = self.tex['hood'][0]
        if dark:
            x,y,z = original.T
            forward = (y+5)/np.maximum(np.hypot(x,y+5),1)
            p = original[z<cuff_height(forward)+5]
            tint = np.clip(.49+.007*(p[:,2]-38)-.012*p[:,0]+.005*p[:,1],0,1)
            color = tones(rgb('#43384f'),rgb('#645570'),tint)
            self.fixed_head_parts = ('cap','tip')
            self.tex['cap'] = night_cap()
            pom = volume((43.7,-29.5,57.1),(7.0,7.0,7.2))
            tint = np.clip(.54+.045*(pom[:,2]-57.1)-.029*(pom[:,0]-43.7)
                           +.012*(pom[:,1]+29.5),0,1)
            self.tex['tip'] = texture(pom,tones(rgb('#b8a5c7'),rgb('#eee1ee'),tint))
        else:
            crown=surface([(62,-.5,-5,21.3,19.8),(69,0,-4,16,15),
                           (77,0,-3,9.5,10),(83,0,-2,4.5,5.5),
                           (87,0,-2,.8,1)])
            p=np.concatenate((original[original[:,2]<62.5],crown))
            x,y,z=p.T
            color=tones(rgb('#edb850'),rgb('#fff1b5'),
                        np.clip(.69-.011*x+.004*(z-55)+.003*y,0,1))
            rays=[]
            for side in (-1,1):
                for x,z,angle,length,y in ((16,91,.55,6.6,1),(29,79,.95,7,0),
                                             (37,62,1.47,6.3,-2)):
                    rays.append(volume((x*side,y,z),(3.8,3.1,length),angle*side))
            rays.append(volume((0,0,99),(4.8,4.3,7.5),0))
            rays=np.concatenate(rays)
            self.top('tip',rays,tones(rgb('#f4bd58'),rgb('#fff0a9'),
                                     np.clip(.75-.007*rays[:,0]+.01*(rays[:,2]-78),0,1)))
        self.tex['hood'] = texture(p,color)
        face, source = self.tex['face']
        if dark:
            x,y,z = face.T
            tint = np.clip(.49+.009*(z-41)-.01*x+.004*y,0,1)
            self.tex['face'] = texture(face,tones(rgb('#4c425c'),
                                                rgb('#60546e'),tint))
        else:
            low,high=rgb('#f4e9cc'),rgb('#fffaf0')
            self.tex['face'] = (face,tuple(tones(low,high,
                                np.clip((color[:,0].astype(float)-220)/35,0,1))
                                for color in source))

    def top(self, name, p, colors):
        self.tex[name] = texture(p,colors)
        self.tops.append((name,np.array([0,0,75])))

    def make_tail(self, dark):
        points=surface([(8,0,-8,3,2),(11,2,-12,5,4),
                        (14,5,-17,5,4),(18,8,-20,4,3),(23,10,-22,1,1)])
        if dark:
            points[:,0] *= -1
            low, high = rgb('#564762'),rgb('#9885a5')
        else:
            points[:,0] *= .68
            low, high = rgb('#eba947'),rgb('#ffe69c')
        color=tones(low,high,np.clip((points[:,2]-8)/15,0,1))
        return points,color,TAILBASE.copy(),np.array([0,0,1.])

    def flat(self, face):
        return {'tail': self.tail}
