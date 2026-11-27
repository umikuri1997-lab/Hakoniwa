"""Draw an original schematic explaining structural modeling choices."""
from pathlib import Path
import math, sys
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle

BG='#f7f8f4'; INK='#244333'; GREEN='#6c9d57'; STEM='#8b6949'; BAD='#aa594e'
fig,axs=plt.subplots(2,3,figsize=(15,8.5),facecolor=BG)
fig.suptitle('BOTANICAL STRUCTURE / Modeling guide',x=.055,ha='left',fontsize=23,weight='bold',color=INK)

def blade(ax,base,angle,L=.62,W=.18,col=GREEN,curve=.09):
    t=np.linspace(0,1,45); d=np.array([np.cos(angle),np.sin(angle)]); s=np.array([-d[1],d[0]])
    b=np.asarray(base); mid=b+t[:,None]*L*d+curve*t[:,None]**2*s; w=W*np.sin(np.pi*t)**.78/2
    poly=np.r_[mid+w[:,None]*s,(mid-w[:,None]*s)[::-1]]
    ax.add_patch(Polygon(poly,closed=True,facecolor=col,edgecolor='#41683b',linewidth=.65)); ax.plot(mid[:,0],mid[:,1],color='#d1dfb4',lw=.8)

def setup(ax,title,sub):
    ax.set_xlim(-1.1,1.1);ax.set_ylim(-.1,1.96);ax.set_aspect('equal');ax.axis('off');ax.set_facecolor(BG)
    ax.set_title(title,loc='left',fontsize=14,color=INK,weight='bold',pad=10)
    ax.text(0,-.065,sub,ha='center',va='top',fontsize=10,color='#52665a')

for ax,mode,title in [(axs[0,0],'alternate','01  Alternate'),(axs[0,1],'opposite','02  Opposite'),(axs[0,2],'whorl','03  Whorled')]:
    setup(ax,title,{'alternate':'One leaf per node; angle is species-specific','opposite':'Two leaves per node; not identical clones','whorl':'Several leaves at the same node'}[mode]); ax.plot([0,0],[.14,1.5],lw=4,color=STEM,solid_capstyle='round')
    for i,y in enumerate([.38,.70,1.02,1.34]):
        angles=([.35 if i%2==0 else 2.8] if mode=='alternate' else ([.4,2.65] if mode=='opposite' else [.28,1.48,2.8]))
        for j,a in enumerate(angles): blade(ax,(0,y),a,.62-.045*i+.03*j,.18-.012*i,col=GREEN,curve=.04*(1 if j%2==0 else -1))
        ax.add_patch(Circle((0,y),.025,color=INK,zorder=4))

ax=axs[1,0];setup(ax,'04  Branch taper','Vary branch diameter and direction; connect nodes')
paths=[([(-.05,.1),(-.09,.5),(.06,.93),(.02,1.45)],[14,11,8,3]),([(-.08,.5),(-.43,.8),(-.76,.99)],[7,4,1.5]),([(.02,.79),(.43,1.02),(.66,1.35)],[6,3,1]),([(-.43,.8),(-.45,1.13),(-.66,1.35)],[3,2,1])]
for p,width in paths:
    for j in range(len(p)-1):ax.plot([p[j][0],p[j+1][0]],[p[j][1],p[j+1][1]],lw=width[j],color=STEM,solid_capstyle='round')
for base,a in [((-.76,.99),2.6),((-.66,1.35),1.9),((.66,1.35),.65),((.02,1.45),1.4),((.43,1.02),.1)]:blade(ax,base,a,.27,.13,curve=.03)
ax=axs[1,1];setup(ax,'05  Layered rosette','Outer mature leaves / inner young leaves')
for i in range(19):
    a=i*math.radians(137.5); t=i/18; blade(ax,(0,.78),a,.75-.52*t,.28-.08*t,col=plt.cm.Greens(.76-.35*t),curve=.13*(1-t))
ax=axs[1,2];setup(ax,'06  Avoid mechanical repetition','Do not use repeated identical blades or floating leaves')
ax.plot([-.13,-.13],[.18,1.45],lw=4,color=STEM)
for y in [.4,.68,.96,1.24]:
    for a in [.25,math.pi-.25]:blade(ax,(-.13,y),a,.57,.19,curve=0,col='#a2af88')
blade(ax,(.48,.24),.45,.39,.16,curve=0,col='#a2af88');ax.plot([.37,.9],[.18,.65],lw=2.5,color=BAD);ax.plot([.37,.9],[.65,.18],lw=2.5,color=BAD)
fig.text(.055,.035,'Conceptual diagrams: actual phyllotaxis, branch angles and leaf shapes must follow the species and growth stage.',fontsize=11,color='#52665a')
fig.subplots_adjust(left=.05,right=.97,top=.88,bottom=.10,hspace=.36,wspace=.2)
fig.savefig(Path(sys.argv[1])/'structure_guide.png',dpi=150);plt.close(fig)
