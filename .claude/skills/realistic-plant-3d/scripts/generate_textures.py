"""Original procedural PBR maps. Python 3, numpy, Pillow. No external files."""
from pathlib import Path
import argparse, json
import numpy as np
from PIL import Image, ImageDraw

SPECS = [
('leaf_broad','leaf',(68,112,38),.57,7),('leaf_rose','leaf',(52,95,40),.56,9),('leaf_olive','leaf',(111,136,83),.67,13),('leaf_cabbage','leaf',(105,151,94),.71,6),('leaf_maple','leaf',(154,72,43),.66,5),('leaf_underside','leaf',(143,164,112),.78,8),('leaf_grass','parallel',(86,139,54),.68,12),('leaf_lily','parallel',(66,114,50),.53,9),
('petal_rose','petal',(213,94,133),.68,7),('petal_lily','petal',(238,237,216),.64,6),('petal_hydrangea','petal',(133,124,211),.72,7),('petal_sunflower','petal',(244,189,40),.67,9),('petal_pansy','pansy',(119,71,182),.71,6),('petal_morning_glory','petal',(97,137,219),.66,8),
('bark_oak','bark',(107,83,61),.86,13),('bark_birch','birch',(190,187,170),.79,9),('bark_cedar','bark',(119,79,53),.87,23),('bark_olive','bark',(123,115,91),.82,7),('stem_green','stem',(79,126,51),.59,9),('stem_woody','stem',(120,101,66),.76,11),('fruit_tomato','fruit',(208,61,38),.45,5),('fruit_blueberry','fruit',(90,104,145),.69,6)]

def make(size, spec, seed):
    name, kind, base, rough, n = spec
    rng=np.random.default_rng(seed)
    t=np.arange(size,dtype=np.float32)/size
    x,y=np.meshgrid(t,t); tau=2*np.pi
    # periodic multi-frequency noise, without baked lighting
    def noise(fx,fy):
        result=np.zeros_like(x)
        for _ in range(7):
            a=int(rng.integers(1,fx+1)); b=int(rng.integers(1,fy+1))
            result+=np.sin(tau*(a*x+b*y)+rng.uniform(0,tau))/7
        return result
    low=noise(4,5); fine=noise(35,42); tiny=noise(73,83)
    h=.03*fine+.012*tiny; variation=low*.15+fine*.07
    if kind=='leaf':
        # rectangular UV: x across blade, y=0 tip, y=1 base; veins fan towards tip
        mid=.5+.015*np.sin(tau*y); d=np.abs(x-mid)
        vein=np.exp(-((x-mid)/.014)**2)
        phase=(y+.38*d+.20*d*d+.022*low)*n
        side=np.exp(-(np.sin(np.pi*phase)/.09)**2)*(.35+.65*np.exp(-d*1.8))
        retic=np.exp(-(np.sin(np.pi*(phase*3.2+6*d+.24*low))/.12)**2)*np.exp(-(np.sin(np.pi*(phase*2.4-9*d))/.65)**2)
        h+=.16*vein+.065*side+.014*retic
        variation+=.23*vein+.11*side+.026*retic-.10*d
    elif kind=='parallel':
        phase=(x+.012*np.sin(tau*y))*n
        veins=np.exp(-(np.sin(np.pi*phase)/.18)**2)
        h+=.085*veins; variation+=.15*veins+.07*np.sin(tau*x)
    elif kind in ('petal','pansy'):
        phase=(x+.023*np.sin(tau*y)+.018*low)*n
        veins=np.exp(-(np.sin(np.pi*phase)/.18)**2)*(.4+.6*y)
        h+=.025*veins; variation+=.055*veins+.20*y-.08
        if kind=='pansy': variation-=.37*np.exp(-((x-.5)/.27)**2-((y-.88)/.25)**2)
        if name=='petal_lily': variation-=.08*np.exp(-((x-.5)/.12)**2)*y
    elif kind=='bark':
        warp=.035*noise(3,5)+.012*noise(6,11)
        phase=n*(x+warp)+.12*noise(7,4)
        crack=np.exp(-(np.sin(np.pi*phase)/.14)**2)
        ridges=np.abs(np.sin(np.pi*phase))**.7
        breaks=np.exp(-(np.sin(np.pi*(4*y+1.1*low+2*x))/.11)**2)*(.5+.5*np.sin(tau*x)**2)
        h+=.28*ridges-.10*crack-.045*breaks+.06*noise(18,7)
        variation+=.22*ridges-.35*crack-.12*breaks+.16*noise(14,5)
    elif kind=='birch':
        lines=np.exp(-(np.sin(np.pi*(n*y+.12*noise(4,7)))/.11)**2)
        spots=np.clip(noise(5,3)*3+.15,0,1)
        lenticels=lines*spots; h-=.1*lenticels; variation-=.53*lenticels
    elif kind=='stem':
        lines=np.sin(tau*(n*x+.12*np.sin(tau*y)))
        h+=.035*lines; variation+=.075*lines
    else:
        variation+=.045*np.sin(tau*x)*np.sin(tau*y)
    rgb=np.clip(np.array(base)[None,None,:]*(1+variation[...,None]),0,255).astype('uint8')
    # OpenGL tangent normal, green towards UV +V (image rows go downward).
    if kind in ('bark','birch','stem','fruit'):
        dy=(np.roll(h,-1,axis=0)-np.roll(h,1,axis=0))/2
        dx=(np.roll(h,-1,axis=1)-np.roll(h,1,axis=1))/2
    else: dy,dx=np.gradient(h)
    norm=np.stack([-dx*5,dy*5,np.ones_like(h)],axis=-1)
    norm/=np.linalg.norm(norm,axis=-1,keepdims=True)
    norm=np.round((norm*.5+.5)*255).astype('uint8')
    r=np.round(np.clip(rough+.07*low-.12*h,.22,.98)*255).astype('uint8')
    return Image.fromarray(rgb),Image.fromarray(norm),Image.fromarray(r)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--size',type=int,default=512); ap.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'assets'/'textures'); args=ap.parse_args()
    if not 64<=args.size<=4096: ap.error('size must be 64–4096')
    args.output.mkdir(parents=True,exist_ok=True)
    manifest=[]; thumb=Image.new('RGB',(880,6*150),(244,243,238)); draw=ImageDraw.Draw(thumb)
    for i,spec in enumerate(SPECS):
        name,kind,*_=spec; folder=args.output/name; folder.mkdir(exist_ok=True)
        maps=make(args.size,spec,12403+i)
        for name_map,im in zip(('basecolor','normal','roughness'),maps):
            im.save(folder/(name_map+'.png'),compress_level=3)
        a=maps[0].resize((200,117),Image.Resampling.LANCZOS); xx=(i%4)*220+10; yy=(i//4)*150+4
        thumb.paste(a,(xx,yy)); draw.text((xx,yy+120),name,fill=(30,30,30))
        manifest.append({'id':name,'kind':kind,'tileable':kind in ('bark','birch','stem','fruit'),'size':args.size,'basecolor':f'{name}/basecolor.png','normal':f'{name}/normal.png','roughness':f'{name}/roughness.png','normal_convention':'OpenGL +Y','source':'original procedural approximation'})
    thumb.save(args.output/'preview.jpg',quality=90)
    (args.output/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
if __name__=='__main__': main()
