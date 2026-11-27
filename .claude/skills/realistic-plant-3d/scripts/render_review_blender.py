"""Run on a separate Blender process: blender -b --factory-startup --python-exit-code 1 -P render_review_blender.py -- model.glb review_dir
Outputs fixed 8 views x clay/material; no existing .blend overwritten. Blender required.
"""
import sys, math
from pathlib import Path
import bpy
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
source=Path(args[0]).resolve(); out=Path(args[1]).resolve(); out.mkdir(parents=True,exist_ok=True)
# Only use this script in the dedicated process described above.
bpy.ops.wm.read_factory_settings(use_empty=True)
if source.suffix.lower()=='.glb': bpy.ops.import_scene.gltf(filepath=str(source))
else: raise ValueError('export to GLB first; this review script accepts only GLB')
scene=bpy.context.scene
objects=[o for o in scene.objects if o.type=='MESH']
if not objects: raise ValueError('no mesh')
pts=[o.matrix_world @ Vector(p) for o in objects for p in o.bound_box]
lo=Vector(tuple(min(p[i] for p in pts) for i in range(3))); hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
c=(lo+hi)/2; d=max((hi-lo).length,0.001)
scene.render.engine='CYCLES'; scene.cycles.samples=24
scene.render.resolution_x=700; scene.render.resolution_y=700; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.world=bpy.data.worlds.new('ReviewWorld');scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.35,.35,.35,1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.7

def aim(o,p): o.rotation_euler=(p-o.location).to_track_quat('-Z','Y').to_euler()
for i,(v,power) in enumerate([((2,-3,4),420),((-3,-1,2),180),((1,3,3),250)]):
    l=bpy.data.lights.new('ReviewLight'+str(i),'AREA'); l.energy=power*d*d; l.shape='DISK';l.size=d*2
    o=bpy.data.objects.new(l.name,l);scene.collection.objects.link(o);o.location=c+Vector(v)*d;aim(o,c)
cam=bpy.data.cameras.new('ReviewCamera');o=bpy.data.objects.new('ReviewCamera',cam);scene.collection.objects.link(o);scene.camera=o
cam.type='ORTHO';cam.ortho_scale=d*1.15;cam.clip_start=d*.001;cam.clip_end=d*20
clay=bpy.data.materials.new('ReviewClay');clay.use_nodes=True;bsdf=clay.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.55,.55,.55,1);bsdf.inputs['Roughness'].default_value=.85
views={'front':(0,-1,0),'back':(0,1,0),'left':(-1,0,0),'right':(1,0,0),'top':(0,0,1),'front_left':(-1,-1,.7),'front_right':(1,-1,.7),'back_right':(1,1,.7)}
for mode in ('clay','material'):
    scene.view_layers[0].material_override=clay if mode=='clay' else None
    for name,v in views.items():
        o.location=c+Vector(v).normalized()*d*3;aim(o,c)
        if name=='top': o.rotation_euler=(0,0,0)
        scene.render.filepath=str(out/f'{mode}_{name}.png');bpy.ops.render.render(write_still=True)
print('Review rendered. Inspect actual pixels; no automatic aesthetic pass.')
