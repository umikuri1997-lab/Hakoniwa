"""Run inside Blender. Import make_material from this file and assign to a UV-mapped mesh."""
from pathlib import Path
import bpy

def make_material(texture_id, library=None, normal_strength=.35, toon=False):
    root=Path(library) if library else Path(__file__).resolve().parents[1]/'assets'/'textures'
    folder=root/texture_id
    paths={name:folder/(name+'.png') for name in ('basecolor','normal','roughness')}
    if not all(p.is_file() for p in paths.values()): raise FileNotFoundError(folder)
    mat=bpy.data.materials.new('Plant_'+texture_id); mat.use_nodes=True
    nodes=mat.node_tree.nodes; links=mat.node_tree.links
    shader=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    shader.inputs['Metallic'].default_value=0
    uv=nodes.new('ShaderNodeTexCoord')
    for i,(name,path) in enumerate(paths.items()):
        image=bpy.data.images.load(str(path),check_existing=True)
        image.colorspace_settings.name='sRGB' if name=='basecolor' else 'Non-Color'
        image.pack()
        tex=nodes.new('ShaderNodeTexImage'); tex.image=image; tex.label=name; tex.location=(-650,300-280*i)
        tex.extension='REPEAT' if texture_id.startswith(('bark_','stem_','fruit_')) else 'EXTEND'
        links.new(uv.outputs['UV'],tex.inputs['Vector'])
        if name=='basecolor': links.new(tex.outputs['Color'],shader.inputs['Base Color'])
        elif name=='roughness':
            if toon: shader.inputs['Roughness'].default_value=.8
            else: links.new(tex.outputs['Color'],shader.inputs['Roughness'])
        else:
            node=nodes.new('ShaderNodeNormalMap'); node.space='TANGENT'; node.inputs['Strength'].default_value=normal_strength*(.35 if toon else 1)
            links.new(tex.outputs['Color'],node.inputs['Color']); links.new(node.outputs['Normal'],shader.inputs['Normal'])
    return mat
