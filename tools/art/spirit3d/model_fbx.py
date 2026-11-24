"""せいれいのモデルを FBX にする（持ち主が Blender で直すため）。
  python3 tools/art/spirit3d/model_fbx.py <spirit_model.blend> <出す .fbx>
入れる物：体・ずきん（土）・頭の上の物（土の芽）・しっぽ（土）・目・ほっぺ・アーマチュア。マテリアル・テクスチャは入れない。
ミラー・ソリディファイ・ベベルは適用、サブディビジョンは適用しない（ポリゴンの少ない形のまま）。"""
import sys
import bpy

src, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.open_mainfile(filepath=src)
EL = 'earth'
for c in list(bpy.data.collections):
    if c.name not in ('common', EL):
        for o in list(c.objects): bpy.data.objects.remove(o)
        bpy.data.collections.remove(c)
for o in list(bpy.data.objects):
    if o.type == 'EMPTY': bpy.data.objects.remove(o)
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    for m in list(o.modifiers):
        if m.type == 'SUBSURF': o.modifiers.remove(m)
    o.data.materials.clear()
    o.name = o.name.replace('_'+EL, '')
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
for im in list(bpy.data.images): bpy.data.images.remove(im)
for o in bpy.data.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
bpy.ops.export_scene.fbx(filepath=out, use_selection=True, object_types={'ARMATURE', 'MESH'}, use_mesh_modifiers=True,
                         add_leaf_bones=False, bake_anim=False, path_mode='STRIP', apply_scale_options='FBX_SCALE_ALL')
print([o.name for o in bpy.data.objects])
