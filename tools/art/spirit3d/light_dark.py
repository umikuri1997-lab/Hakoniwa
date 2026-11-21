"""トモリとツキミの頭巾・しっぽ・胸飾り。座標はチップのドット。

顔・耳の位置と体、手足の形、骨は水の精霊と同じ。
トモリは金色の縁のある頭巾、頭の後ろ側に並ぶ七つの光、胸のしずく。
ツキミは紫のナイトキャップ、肩にかかる布と胸の三日月。淡い桃紫の
折り返しは額で高さ約56ドット、うなじで約32ドット。幅12〜16ドットの
帯を頭に回し、その上辺に丸い紫の布をつなぐ。布は後頭部の中央近くで
帯の上にたれ、うなじの高さで直径約18ドットの房をとめる。
ケープは首もとから幅約64ドットに広がり、肩と背中を一枚の布で包む。
胸の前は開いて三日月で留め、裾は丸い波形にする。
"""
from math import pi
import numpy as np
from scipy.interpolate import PchipInterpolator

from core import QH, TAILBASE, Spirit, rx, ry, rz

LIGHT = {
    'hood': '#ffdc75', 'dark': '#eeb75d', 'cheek': '#fff0ba',
    'eye': '#3f5e26', 'hand': '#fff3d5', 'line': '#e6bd76',
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


def volume(center, radii):
    """房の丸い表面。"""
    theta = np.linspace(0, 2*pi, 112, endpoint=False)
    phi = np.linspace(0, pi, 49)
    t, p = np.meshgrid(theta, phi)
    points = np.column_stack((np.cos(t).ravel()*np.sin(p).ravel(),
                              np.sin(t).ravel()*np.sin(p).ravel(),
                              np.cos(p).ravel()))
    return points*np.array(radii)+center


def light_petals():
    """正面と横の両方で粒が読めるよう、先のとがった光を後ろへ配る。"""
    theta = np.linspace(0,2*pi,112,endpoint=False)
    height = np.linspace(-1,1,89)[:,None]
    radius = (1-height**2)**.86
    shape = np.stack(np.broadcast_arrays(radius*np.cos(theta),
                                         radius*np.sin(theta),height),axis=-1).reshape(-1,3)
    color = tones(rgb('#fff8da'),rgb('#ffd571'),np.clip(.56+.48*shape[:,2],0,1))
    rays = []
    for sign in (-1,1):
        for x,y,z,angle,tilt,length in ((18,-16,89,.59,.37,9.3),
                                        (31,-25,77,1.05,.51,9.2),
                                        (40,-35,61,1.51,.55,8.4)):
            rotation = rz(-sign*.35)@rx(tilt)@ry(sign*angle)
            rays.append((shape*(4.7,4.0,length))@rotation.T+(sign*x,y,z))
    rays.append((shape*(5.1,4.1,9.2))@rx(.14).T+(0,-4,99))
    return texture(np.concatenate(rays),np.tile(color,(len(rays),1)))


def gold_hood(points):
    """丸い頭巾の表面を明るくし、写した形のふちに金色を残す。"""
    x,y,z = points.T
    rows = np.rint((z-z.min())/QH).astype(int)
    colors = []
    for across in (x,y):
        lo = np.full(rows.max()+1,np.inf)
        hi = np.full(rows.max()+1,-np.inf)
        np.minimum.at(lo,rows,across)
        np.maximum.at(hi,rows,across)
        distance = np.minimum(across-lo[rows],hi[rows]-across)
        light = np.clip(.67+.24*distance/5-.004*x+.002*(z-48),0,1)
        rim = np.clip((distance-.65)/3.7,0,1)
        colors.append(tones(rgb('#f2b84e'),rgb('#fff0b7'),.33*light+.67*rim*light))
    return points,(colors[0],colors[1],colors[0])


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
    at[:,1] += 1.9 if dark else .32
    return at,pigment


def cuff_height(front):
    return 45+11*np.maximum(front,0)**1.37-13*np.maximum(-front,0)**1.45


def night_cap():
    """折り返しの上辺から、垂れた先まで断面をつないだ布の帽子。"""
    theta = np.linspace(0,2*pi,640,endpoint=False)
    dx,dy = np.cos(theta),np.sin(theta)
    low = cuff_height(dy)
    back = np.maximum(-dy,0)
    width = 12+4*np.maximum(dy,0)
    # 後頭部のふくらみを越えて、うなじへ向かう厚みのある帯。
    rim_x = -.7+dx*(30.7+2.2*(1-np.maximum(dy,0)))
    rim_y = -5+dy*(24.8+6.6*back)
    t = np.linspace(0,1,73)[:,None]
    roll = np.sin(pi*t)
    cuff = np.stack((rim_x+1.55*dx*roll,rim_y+1.6*dy*roll,
                     low+width*t),axis=-1).reshape(-1,3)
    cuff_colors = tones(rgb('#d9b7df'),rgb('#fff0f8'),
                        np.clip(.55+.016*(t*width).ravel()
                                -.008*cuff[:,0]+.004*cuff[:,1],0,1))

    # 丸い頂部から後頭部をまわり、中央近くの房へ下がる。
    rows = np.array([
        (0, 0,-5,58.7,32,28),
        (.16,0,-7,66,31,25),
        (.32,1,-12,73,28,21),
        (.49,2,-21,76,22,17),
        (.65,3,-31,70,15,12),
        (.80,4,-37,60,10,8),
        (.91,5,-42,49,6,4.5),
        (1,6,-43,40,2.5,3.5),
    ])
    u = np.linspace(0,1,440)
    result = PchipInterpolator(rows[:,0],rows[:,1:],axis=0)(u)
    center,radii = result[:,:3],result[:,3:]
    forward = np.gradient(center,axis=0)
    forward /= np.linalg.norm(forward,axis=1,keepdims=True)
    side = np.array([1.,0,0])-forward*forward[:,0,None]
    side /= np.linalg.norm(side,axis=1,keepdims=True)
    depth = np.cross(forward,side)
    fabric = (center[:,None,:]+dx[None,:,None]*radii[:,0,None,None]*side[:,None,:]
              +dy[None,:,None]*radii[:,1,None,None]*depth[:,None,:])
    # 根もとは折り返しと辺を共有し、上へ行く間に布の丸みへつなぐ。
    rim = np.stack((rim_x,rim_y,low+width),axis=1)
    weight = np.clip(1-u/.24,0,1)**2
    fabric += weight[:,None,None]*(rim-fabric[0])[None,:,:]
    p = fabric.reshape(-1,3)
    pigment = tones(rgb('#654977'),rgb('#af87b9'),
                    np.clip(.22+.015*(p[:,2]-52)-.006*p[:,0]+.003*p[:,1],0,1))
    cloth = np.concatenate((cuff,p))
    colors = np.concatenate((cuff_colors,pigment))
    # 斜めから写しても布に点のすきまができないよう、細かい間隔で点をまとめる。
    pitch = QH/2
    grid = np.rint(cloth/pitch).astype(np.int16)
    vertices,first = np.unique(grid,axis=0,return_index=True)
    return texture(vertices.astype(float)*pitch,colors[first])


def mantle():
    """三日月の留め具から肩と背中を一枚で包む短いケープ。"""
    drop = np.linspace(0,1,115)[:,None]
    around = np.linspace(0,1,560)
    opening = .035+.36*drop**1.35
    angle = opening+(2*pi-2*opening)*around
    side,front = np.sin(angle),np.cos(angle)

    # 襟から肩へ広げ、六つの丸い山が裾につながる。
    lobe = .5+.5*np.cos(6*angle)
    ripple = lobe*drop**2.4
    x = (9.4+22.2*drop+1.4*ripple)*side
    y = (11.5+9.8*drop+.9*ripple)*front
    y += drop*(4.5*side**2-.7)
    # 背中の布はしっぽのつけ根を覆い、下からしっぽを出す。
    y -= 9*np.maximum(-front,0)**5*np.sin(pi*drop)**1.5
    hem = 16.3+1.1*front-5*lobe
    z = 28.7+(hem-28.7)*drop**1.3
    cloth = np.stack((x,y,z),axis=-1).reshape(-1,3)

    shade = np.clip(.69-.26*drop+.15*lobe*drop-.09*side+.035*front,0,1)
    color = tones(rgb('#875995'),rgb('#c9a6d2'),shade.ravel())
    return cloth,color


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
            self.body_color = rgb('#584466')
            self.arm_color = rgb('#847392')
            self.far_leg_color = rgb('#4c385a')
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
            color = tones(rgb('#493655'),rgb('#6c5379'),tint)
            self.fixed_head_parts = ('cap','tip')
            self.tex['hood'] = texture(p,color)
            self.tex['cap'] = night_cap()
            pom = volume((6,-43,33.5),(8.8,8.4,8.8))
            tint = np.clip(.55+.034*(pom[:,2]-33.5)-.028*(pom[:,0]-6)
                           +.012*(pom[:,1]+43),0,1)
            self.tex['tip'] = texture(pom,tones(rgb('#c394d3'),rgb('#fff0f8'),tint))
        else:
            crown=surface([(62,-.5,-5,21.3,19.8),(69,0,-4,16,15),
                           (77,0,-3,9.5,10),(83,0,-2,4.5,5.5),
                           (87,0,-2,.8,1)])
            p = np.concatenate((original[original[:,2]<62.5],crown))
            self.tex['hood'] = gold_hood(p)
            self.tex['tip'] = light_petals()
            self.tops.append(('tip',np.array([0,0,75])))
        face, source = self.tex['face']
        if dark:
            x,y,z = face.T
            tint = np.clip(.49+.009*(z-41)-.01*x+.004*y,0,1)
            self.tex['face'] = texture(face,tones(rgb('#534263'),
                                                rgb('#70587e'),tint))
        else:
            low,high=rgb('#f4e9cc'),rgb('#fffaf0')
            self.tex['face'] = (face,tuple(tones(low,high,
                                np.clip((color[:,0].astype(float)-220)/35,0,1))
                                for color in source))

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
