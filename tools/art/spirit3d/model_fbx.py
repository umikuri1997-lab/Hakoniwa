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
# ふつうの FBX にそろえる：モディファイアを適用した形に、はなれた点・線をけし、UV をひらく（UV のないメッシュは、ほかの道具でこわれることがある）
import bmesh
dg = bpy.context.evaluated_depsgraph_get()
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    am = [m for m in o.modifiers if m.type == 'ARMATURE']
    keep = {m.name: m.show_viewport for m in am}
    for m in am: m.show_viewport = False
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    for m in am: m.show_viewport = keep[m.name]
    for m in [m for m in o.modifiers if m.type != 'ARMATURE']: o.modifiers.remove(m)
    old = o.data; o.data = me; bpy.data.meshes.remove(old)
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
    bm.to_mesh(me); bm.free()
    for v in me.vertices:   # ミラーでつないだまん中の点も、4本まで・合計1
        gs = sorted(v.groups, key=lambda g: -g.weight); keep = gs[:4]; tot = sum(g.weight for g in keep) or 1.0
        drop = [g.group for g in gs[4:]]; ws = {g.group: g.weight/tot for g in keep}
        for gi in drop: o.vertex_groups[gi].remove([v.index])
        for gi, w in ws.items(): o.vertex_groups[gi].add([v.index], w, 'REPLACE')
    if me.has_custom_normals: me.normals_split_custom_set([(0, 0, 0)]*len(me.loops)); 
    for p in me.polygons: p.use_smooth = True
    bpy.context.view_layer.objects.active = o
    for x in bpy.data.objects: x.select_set(x == o)
    with bpy.context.temp_override(active_object=o, object=o, selected_objects=[o], selected_editable_objects=[o]):
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')
for im in list(bpy.data.images): bpy.data.images.remove(im)
for o in bpy.data.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
bpy.ops.export_scene.fbx(filepath=out, use_selection=True, object_types={'ARMATURE', 'MESH'}, use_mesh_modifiers=False, mesh_smooth_type='FACE',
                         add_leaf_bones=False, bake_anim=False, path_mode='STRIP', apply_scale_options='FBX_SCALE_ALL')
print([o.name for o in bpy.data.objects])
