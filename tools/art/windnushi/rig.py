"""風のヌシ様の設計図。Blender のバックグラウンド実行用。

A案。幅1.1マスの細い胴に、後ろへ流れる冠羽と金色のくちばしをつける。
左右の羽は胴の内側から出し、肩からひじまで1.75マス、ひじから
外へ2.85マス。雲の丸みをもたせた覆羽を重ね、後縁を7枚の風切羽で
ふくらませる。飛ぶ羽は外にいくほど上に反らせる。尾は根元を共有し、
左右に2本の長い飾り羽と、内がわに短い支え羽をつける。
翼は左右それぞれ2本の骨。ひじの近くは内外の骨に重みを渡す。
"""

from math import cos, pi, sin
from pathlib import Path
import json
import sys

import bpy
from mathutils import Matrix, Vector


FRAMES = 16
FPS = 10
SHOULDER = 0.48
ELBOW = 2.23
TIP = 5.08
WING_Z = 0.24

COLORS = {
    "Snow": (250, 253, 255),
    "Cloud": (224, 241, 250),
    "Wing": (239, 249, 254),
    "Flight feather": (213, 233, 248),
    "Gold": (246, 196, 111),
    "Ochre": (216, 150, 69),
    "Eye": (64, 93, 123),
    "Cheek": (247, 213, 206),
}


def create_materials():
    materials = {}
    for name, rgb in COLORS.items():
        material = bpy.data.materials.new(name)
        material.diffuse_color = tuple(
            ((v / 255 + 0.055) / 1.055) ** 2.4 if v > 10 else v / 3294.6
            for v in rgb
        ) + (1,)
        materials[name] = material
    return materials


def create_rig():
    armature = bpy.data.armatures.new("Cloud bird skeleton")
    rig = bpy.data.objects.new("Wind guardian", armature)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    rig.show_in_front = True
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, head, tail, parent=None, connected=False):
        b = armature.edit_bones.new(name)
        b.head, b.tail = head, tail
        if parent:
            b.parent = armature.edit_bones[parent]
            b.use_connect = connected

    bone("Body", (0, -0.65, 0), (0, 0.75, 0))
    bone("Head", (0, 0.72, 0.3), (0, 1.45, 0.56), "Body")
    bone("Tail", (0, -0.95, 0), (0, -2.38, -0.05), "Body")
    for sign, suffix in ((1, "L"), (-1, "R")):
        bone(f"Wing.{suffix}", (sign * SHOULDER, 0, WING_Z),
             (sign * ELBOW, 0, WING_Z), "Body")
        bone(f"Tip.{suffix}", (sign * ELBOW, 0, WING_Z),
             (sign * TIP, 0, WING_Z), f"Wing.{suffix}", connected=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def create_model(rig, materials):
    def oval(name, center, radii, color, attachment, angle=0, detail=14, sweep=None):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=detail, ring_count=9)
        obj = bpy.context.object
        obj.name = name
        rotation = Matrix.Rotation(angle, 3, "Z")
        for vertex in obj.data.vertices:
            position = Vector(a * b for a, b in zip(vertex.co, radii))
            if sweep is not None:
                position += Vector(sweep(vertex.co.y))
            vertex.co = rotation @ position + Vector(center)
        obj.data.materials.append(materials[color])
        for face in obj.data.polygons:
            face.use_smooth = color not in ("Eye", "Cheek")

        if attachment in ("L", "R"):
            wing = obj.vertex_groups.new(name=f"Wing.{attachment}")
            tip = obj.vertex_groups.new(name=f"Tip.{attachment}")
            for vertex in obj.data.vertices:
                t = max(0, min(1, (abs(vertex.co.x) - ELBOW + 0.48) / 0.96))
                t = t * t * (3 - 2 * t)
                if t < 1:
                    wing.add([vertex.index], 1 - t, "REPLACE")
                if t > 0:
                    tip.add([vertex.index], t, "REPLACE")
        else:
            group = obj.vertex_groups.new(name=attachment)
            group.add(range(len(obj.data.vertices)), 1, "REPLACE")

        obj.parent = rig
        modifier = obj.modifiers.new("Wing and body bones", "ARMATURE")
        modifier.object = rig
        modifier.use_deform_preserve_volume = True
        return obj

    oval("Body", (0, -0.10, 0.03), (0.54, 1.38, 0.48), "Snow", "Body")
    oval("Breast", (0, 0.36, -0.11), (0.45, 0.82, 0.39), "Cloud", "Body")
    oval("Neck", (0, 0.74, 0.37), (0.30, 0.53, 0.45), "Snow", "Body")
    oval("Crown", (0, 1.01, 0.64), (0.40, 0.51, 0.40), "Snow", "Head", detail=24)
    for sign in (-1, 1):
        for i in range(3):
            oval("Swept crest", (sign * (0.13 + 0.073 * i), 0.50 - 0.13 * i, 0.89 - 0.077 * i),
                 (0.073, 0.57 + 0.064 * i, 0.058), "Snow" if i < 2 else "Wing",
                 "Head", sign * 0.18, sweep=lambda t: (0, 0, 0.20 * min(0, t) ** 2))
        oval("Eye", (sign * 0.282, 1.318, 0.711), (0.074, 0.061, 0.080),
             "Eye", "Head", -sign * 0.55)
        oval("Eye light", (sign * 0.282 - 0.018, 1.366, 0.74), (0.022, 0.022, 0.025),
             "Snow", "Head")
    oval("Lower bill", (0, 1.51, 0.52), (0.11, 0.17, 0.055), "Ochre", "Head")
    oval("Upper bill", (0, 1.53, 0.565), (0.125, 0.21, 0.079), "Gold", "Head")
    oval("Tail base", (0, -1.24, -0.02), (0.35, 0.53, 0.14), "Wing", "Tail")
    for sign in (-1, 1):
        oval("Short tail feather", (sign * 0.33, -1.72, -0.018),
             (0.17, 0.78, 0.084), "Cloud", "Tail", sign * 0.28)
        oval("Forked tail streamer", (sign * 0.68, -2.37, -0.025),
             (0.17, 1.47, 0.080), "Snow", "Tail", sign * 0.34, detail=22,
             sweep=lambda t, side=sign: (side * 0.49 * min(t, 0) ** 2, 0, 0.14 * min(t, 0)))

    for sign, suffix in ((1, "L"), (-1, "R")):
        oval("Shoulder plumage", (sign * 0.98, -0.04, 0.24), (1.05, 0.71, 0.32),
             "Snow", suffix, -sign * 0.15)
        oval("Forewing", (sign * 2.19, -0.24, 0.23), (1.67, 0.64, 0.25),
             "Wing", suffix, -sign * 0.16)
        for i in range(7):
            span = 1.09 + i * 0.55
            oval("Flight feather", (sign * span, -0.84 - i * 0.05, 0.11 + 0.31 * (i / 6) ** 2),
                 (0.30 - i * 0.018, 0.79 + i * 0.026, 0.15 - i * 0.010),
                 "Flight feather" if i % 2 == 0 else "Cloud",
                 suffix, sign * (0.29 + i * 0.16),
                 sweep=lambda t, strength=i / 6: (0, 0, 0.48 * strength * min(t, 0) ** 2))
        for i in range(5):
            oval("Cloud covert", (sign * (1.38 + 0.71 * i), -0.48 - 0.075 * i, 0.31),
                 (0.47 - 0.024 * i, 0.48 - 0.019 * i, 0.21 - 0.022 * i),
                 "Snow" if i < 3 else "Wing", suffix, sign * (0.2 + 0.14 * i))


def animate(rig):
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_end = FRAMES
    downstroke_frames = 5.5
    recovery_start = 7.5

    def stroke_phase(t):
        t %= FRAMES
        if t < downstroke_frames:
            return pi * t / downstroke_frames
        if t < recovery_start:
            return pi
        return pi + pi * (t - recovery_start) / (FRAMES - recovery_start)

    def key(name, rotation, frame):
        pose = rig.pose.bones[name]
        rest = pose.bone.matrix_local.to_3x3()
        pose.rotation_mode = "XYZ"
        pose.rotation_euler = (rest.inverted() @ rotation @ rest).to_euler()
        pose.keyframe_insert("rotation_euler", frame=frame)

    for frame in range(1, FRAMES + 2):
        t = frame - 1
        phase = stroke_phase(t)
        lag = stroke_phase(t - 1.5)
        recovery = max(0, -sin(phase))
        pitch = 0.058 * sin(stroke_phase(t - 0.7))
        key("Body", Matrix.Rotation(pitch, 3, "X"), frame)
        key("Head", Matrix.Rotation(-pitch * 0.82, 3, "X"), frame)
        key("Tail", Matrix.Rotation(-0.12 * sin(lag), 3, "X"), frame)

        for sign, suffix in ((1, "L"), (-1, "R")):
            # 打ち下ろしは翼を広げ、戻すときは翼の先を後ろへ少し折る。
            lift = 0.08 + 0.57 * cos(phase)
            shoulder = (Matrix.Rotation(-sign * 0.095 * recovery, 3, "Z")
                        @ Matrix.Rotation(-sign * lift, 3, "Y"))
            key(f"Wing.{suffix}", shoulder, frame)
            bend = 0.43 * (cos(lag) - cos(phase)) - 0.16 * recovery
            fold = -sign * (0.035 + 0.43 * recovery)
            feather_pitch = 0.23 * sin(lag)
            tip = (Matrix.Rotation(fold, 3, "Z")
                   @ Matrix.Rotation(-sign * bend, 3, "Y")
                   @ Matrix.Rotation(feather_pitch, 3, "X"))
            key(f"Tip.{suffix}", tip, frame)


def sample_meshes(rig, face_only=False):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    parts = []
    for obj in rig.children:
        if face_only and obj.vertex_groups.get("Head") is None:
            continue
        posed = obj.evaluated_get(depsgraph)
        mesh = posed.to_mesh()
        mesh.calc_loop_triangles()
        parts.append({
            "color": mesh.materials[0].name,
            "detail": obj.name.startswith(("Eye", "Cheek", "Lower bill", "Upper bill")),
            "vertices": [[round(v, 6) for v in point.co] for point in mesh.vertices],
            "triangles": [list(poly.vertices) for poly in mesh.loop_triangles],
        })
        posed.to_mesh_clear()
    return parts


def main(output, geometry):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    rig = create_rig()
    create_model(rig, create_materials())
    animate(rig)

    scene = bpy.context.scene
    meshes = {}
    for i in range(FRAMES):
        scene.frame_set(i + 1)
        meshes[f"fly_{i:02}"] = sample_meshes(rig)
    for pose in rig.pose.bones:
        pose.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()
    meshes["support"] = sample_meshes(rig)
    meshes["face"] = sample_meshes(rig, face_only=True)
    geometry.write_text(json.dumps({"colors": COLORS, "poses": meshes}))
    scene.frame_set(5)
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.wm.save_as_mainfile(filepath=str(output), compress=True)


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:]
    main(*(Path(arg).resolve() for arg in args))
