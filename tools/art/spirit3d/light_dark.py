"""トモリとツキミの頭巾・しっぽ・胸飾り。座標はチップのドット。

顔・耳の位置と体、手足の形、骨は水の精霊と同じ。
トモリは金色の頭巾、七つの光、胸のしずく。ツキミは右へ
垂れる紫の頭巾、うす紫の折り返しと房、肩にかかる布と胸の三日月。
"""
from math import pi
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_erosion, distance_transform_edt

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


def night_cap():
    """帽子の外周を丸め、一つながりの断面から厚みを作る。"""
    contour = np.array([
        (-13,23),(-25,27),(-32,35),(-34,45),(-32,56),(-27,67),
        (-17,79),(-4,89),(12,96),(24,96),(35,91),(43,82),(48,70),
        (49,61),(46,56),(42,56),(39,61),(34,69),(28,74),(30,63),
        (32,53),(33,43),(28,32),(19,26),(9,23),
    ], dtype=float)
    outline = []
    for i in range(len(contour)):
        a,b,c,d = contour[(i+np.array([-1,0,1,2]))%len(contour)]
        for t in np.linspace(0,1,10,endpoint=False):
            point = (2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+
                     (-a+3*b-3*c+d)*t*t*t)/2
            outline.append(tuple(point))
    xs = np.arange(-39,53,QH)
    ys = np.arange(-42,30,QH)
    zs = np.arange(20,100,QH)
    mask = Image.new('1',(len(xs),len(zs)))
    ImageDraw.Draw(mask).polygon([((x-xs[0])/QH,(z-zs[0])/QH)
                                  for x,z in outline],fill=1)
    front = np.array(mask).T
    distance = distance_transform_edt(front)*QH
    depth = np.interp(zs,(20,37,53,68,80,92,100),(11,23,26,26,22,14,5))
    inset = np.minimum(distance,depth)
    half = np.sqrt(inset*(2*depth-inset))
    cx,cz = np.meshgrid(xs,zs,indexing='ij')
    center = -5-.98*np.maximum(0,cx-24)-.10*np.maximum(0,cz-71)
    body = front[:,None,:] & (np.abs(ys[None,:,None]-center[:,None,:])
                             <= half[:,None,:])
    x,y,z = np.nonzero(body & ~binary_erosion(body,iterations=2))
    return np.column_stack((xs[x],ys[y],zs[z]))


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
            p = night_cap()
            x,y,z = p.T
            tint = np.clip(.55+.006*(z-60)-.006*x+.004*y,0,1)
            color = tones(rgb('#453a56'),rgb('#766684'),tint)
            # 折り返しは帽子の表面を回り、横に行くほど幅を細くする。
            angle = np.arctan2(np.abs(x),y+7)/(pi/2)
            top = 74-24*np.clip(angle,0,1)**1.55
            width = 16*np.clip((1.14-angle)/.30,0,1)
            trim = (z<top)&(z>top-width)
            color[trim] = tones(rgb('#bbacc9'),rgb('#eee0ee'),
                                np.clip(.63-.010*x[trim]+.012*(z[trim]-53),0,1))
            pom = volume((44,-28,53),(7.5,7.4,7.6))
            tint = np.clip(.54+.045*(pom[:,2]-53)-.029*(pom[:,0]-44)
                           +.012*(pom[:,1]+28),0,1)
            self.top('tip',pom,tones(rgb('#b8a5c7'),rgb('#eee1ee'),tint))
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
