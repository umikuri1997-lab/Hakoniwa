"""H-6 水路と小舟の設計図。寸法はマス、1マス64ドットで写す。

B案。運河の幅は0.75。川底は岸より0.14低い。白い石壁の上に
水色の笠石をのせる。左右上下は柵と同じ1・2・4・8。
小舟は長さ0.94、幅0.43。丸い船腹を白い板と水色の帯で包み、
船首と船尾に白い船首材を立てる。船底に板を敷き、座板は内側の
受け木にのせる。木箱は敷板の上に置く。いかだは長さ0.66の丸太を4本、
その上の2本の横木でしばる。
"""

import argparse
from functools import lru_cache
from itertools import product
from math import cos, radians, sin, tau
from pathlib import Path
import sys

import numpy as np

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import oblique3d as O


COPING = ((145, 195, 235), (163, 208, 245))
COPING_SIDE = (119, 171, 218)
COPING_JOINT = (127, 175, 215)
STONE = (246, 236, 221)
STONE_WALL = (210, 205, 204)
BED = (208, 203, 194)
PAVERS = ((226, 219, 206), (238, 229, 214))
WATER = (95, 199, 225)
POOL_WATER = (86, 186, 220)
WOOD = (225, 177, 113)
RIM = (249, 215, 162)
PAINT = (110, 176, 226)
HULL = (248, 239, 224)
KEEL = (214, 204, 198)
ROPE = (255, 248, 234)
TEXTURES = Path(__file__).resolve().parents[1] / "textures"
STONE_TEXTURE = O.Tex(TEXTURES / "rock030.png", span=1.0, flow=4, minrun=4,
                      dark=(0.15, 0.93), light=(0.12, 1.04))
WOOD_TEXTURE = O.Tex(TEXTURES / "wood049.png", dark=(0.17, 0.88), light=(0.13, 1.06))


def flat_box(scene, bounds, color, texture=None):
    scene.material("flat")
    scene.texture(texture)
    scene.box(*bounds, color, bevel=0)
    scene.texture(None)


def water_level(pool):
    return -0.09 if pool else -0.077


def canal(mask, wet, pool=False):
    scene = O.Scene()
    scene.group("stone")
    # 端をまたぐ水面は、見おろしでずれるぶんだけ隣のマスへ伸ばす。
    bed_z = -0.14
    flat_box(scene, (0, -0.25, bed_z - 0.01, 1, 1.1, bed_z), BED, STONE_TEXTURE)
    if wet or pool:
        water_z = water_level(pool)
        scene.material("clear")
        scene.part()
        scene.quad((0, -0.25, water_z), (1, -0.25, water_z),
                   (1, 1.1, water_z), (0, 1.1, water_z), POOL_WATER if pool else WATER)
    for row, col in product(range(8), repeat=2):
        vertical = ((col == 0 and not mask & 1) or (col == 7 and not mask & 2))
        horizontal = ((row == 0 and not mask & 4) or (row == 7 and not mask & 8))
        corner = row in (0, 7) and col in (0, 7)
        if not (vertical or horizontal or (corner and not pool)):
            continue
        x, y = col / 8, row / 8
        wall_y0 = y if row else -0.25
        wall_y1 = y + 0.125 if row != 7 else 1.1
        flat_box(scene, (x, wall_y0, -0.16, x + 0.125, wall_y1, -0.081),
                 STONE_WALL, STONE_TEXTURE)
        flat_box(scene, (x, wall_y0, -0.081, x + 0.125, wall_y1, -0.036),
                 STONE, STONE_TEXTURE)
        flat_box(scene, (x, y if row else -0.032, -0.036,
                         x + 0.125, y + 0.125, -0.014), COPING_SIDE)
        coping_block(scene, row, col, horizontal, vertical)
    for row in range(3):
        for col in range(4):
            x = 0.15 + col * 0.17 + (row % 2) * 0.035
            y = 0.15 + row * 0.165
            flat_box(scene, (x, y, bed_z, x + 0.145, y + 0.145, bed_z + 0.01),
                     PAVERS[(row + col) % 2], STONE_TEXTURE)
    return scene


def coping_block(scene, row, col, horizontal, vertical):
    """マスの向きにかかわらず、直線は8ドットの石に1ドットの目地。"""
    x, y = col / 8, row / 8
    end_x, end_y = x + 0.125, y + 0.125
    joint = 1 / 64
    if horizontal and not vertical:
        flat_box(scene, (x, y, -0.014, x + joint, end_y, 0), COPING_JOINT)
        x += joint
        color = COPING[col % len(COPING)]
    elif vertical and not horizontal:
        flat_box(scene, (x, y, -0.014, end_x, y + joint, 0), COPING_JOINT)
        y += joint
        color = COPING[row % len(COPING)]
    else:
        # 隣の石が目地を持たない側だけ、角石に目地を入れる。
        if horizontal and vertical and col == 7:
            flat_box(scene, (x, y, -0.014, x + joint, end_y, 0), COPING_JOINT)
            x += joint
        if horizontal and vertical and row == 7:
            flat_box(scene, (x, y, -0.014, end_x, y + joint, 0), COPING_JOINT)
            y += joint
        color = COPING[0]
    scene.material("shiny")
    scene.box(x, y, -0.014, end_x, end_y, 0, color, bevel=0)


def mirror_above_water(vertices, water_z):
    """水面より上の面だけを切り出し、同じ水面を軸に折り返す。"""
    clipped = []
    for a, b in zip(vertices, (*vertices[1:], vertices[0])):
        above_a, above_b = a[2] >= water_z, b[2] >= water_z
        if above_a:
            clipped.append(a)
        if above_a != above_b:
            clipped.append(a + (b - a) * ((water_z - a[2]) / (b[2] - a[2])))
    return [(x, y, 2 * water_z - z) for x, y, z in clipped]


@lru_cache(maxsize=1)
def water_texture(size):
    """生成画像の光を1マスぶんのタイルにする。両端を重ねてつなぐ。"""
    overlap = size // 4
    with Image.open(TEXTURES / "water-h6-generated.png") as source:
        light = np.asarray(source.convert("L").resize((size + overlap,) * 2, Image.Resampling.BOX),
                           dtype=float)
    ramp = (0.5 - 0.5 * np.cos(np.linspace(0, tau / 2, overlap)))[None, :]
    for axis in (0, 1):
        if axis == 1:
            light = light.T
        light[:, :overlap] = light[:, size:] * (1 - ramp) + light[:, :overlap] * ramp
        light = light[:, :size]
        if axis == 1:
            light = light.T
    low, high = np.percentile(light, (18, 96))
    strength = np.clip((light - low) / (high - low), 0, 1)
    return np.digitize(strength, (0.23, 0.42, 0.61, 0.79))


def render_canal(mask, wet, pool=False):
    scene = canal(mask, wet, pool)
    bounds = (0, 1, 0, 1)
    image = O.render_px(scene, O.game, bounds, O.VIEW, outer=False)
    if not (wet or pool):
        return image

    surface = O.LAST_CLR.copy()
    water_z = water_level(pool)
    mirror = O.Scene()
    mirror.material("flat")
    mirror.part()
    for a, b, c, color, part in scene.t:
        if scene.mt.get(part) == "clear":
            continue
        points = mirror_above_water((a, b, c), water_z)
        for j in range(1, len(points) - 1):
            mirror.tri(points[0], points[j], points[j + 1], color)

    reflected = np.asarray(O.render_px(mirror, O.game, bounds, O.VIEW,
                                      outer=False, merge=0))
    visible = surface & (reflected[..., 3] == 255)
    pixels = np.array(image)
    y, x = np.indices(surface.shape)
    texture = water_texture(O.S)[(y + round(0.8 * water_z * O.S)) % O.S, x % O.S]
    light = np.array(((0, 0, 0), (4, 7, 10), (10, 14, 18), (18, 23, 26), (27, 32, 34)))
    pixels[surface, :3] = np.minimum(255, pixels[surface, :3] + light[texture[surface]])
    # ふちの像を水色に寄せ、底の敷石も見える濃さで水面に混ぜる。
    reflection = reflected[visible, :3] * 0.79 + np.array((132, 210, 230)) * 0.21
    pixels[visible, :3] = np.rint(pixels[visible, :3] * 0.48 + reflection * 0.52)
    return Image.fromarray(pixels)


def ring(scene, lower, upper, color):
    scene.part()
    for index in range(len(lower)):
        following = (index + 1) % len(lower)
        scene.quad(lower[index], lower[following], upper[following], upper[index], color)


def boat(cargo):
    scene = O.Scene()
    scene.group("hull")
    scene.smooth(True)
    plan = []
    for j in range(48):
        angle = j * tau / 48
        x = 0.466 * cos(angle)
        width = 0.215 * (1 - 0.24 * cos(angle))
        plan.append((x, width * sin(angle) * (1 - 0.31 * cos(angle) ** 2)))

    def section(length, width, height, rise):
        return [(x * length, y * width, height + rise * (abs(x) / 0.466) ** 4)
                for x, y in plan]

    keel = section(0.72, 0.49, -0.13, 0.050)
    lower = section(0.84, 0.72, -0.085, 0.062)
    stripe_bottom = section(0.93, 0.88, -0.035, 0.067)
    stripe_top = section(0.98, 0.96, 0.045, 0.070)
    rail_base = section(1, 1, 0.105, 0.082)
    rail_outer = section(1.012, 1.02, 0.133, 0.093)
    rail_inner = section(0.97, 0.88, 0.133, 0.093)
    inner_wall = section(0.935, 0.85, 0.09, 0.08)
    floor = section(0.72, 0.53, -0.065, 0.020)

    scene.material("soft1")
    ring(scene, keel, lower, KEEL)
    ring(scene, lower, stripe_bottom, HULL)
    scene.material("shiny")
    ring(scene, stripe_bottom, stripe_top, PAINT)
    ring(scene, stripe_top, rail_base, HULL)
    ring(scene, rail_base, rail_outer, HULL)
    ring(scene, rail_outer, rail_inner, ROPE)
    ring(scene, rail_inner, inner_wall, HULL)
    scene.material("soft1")
    scene.texture(WOOD_TEXTURE)
    ring(scene, inner_wall, floor, WOOD)
    scene.part()
    for i in range(1, len(floor) - 1):
        scene.tri(floor[0], floor[i], floor[i + 1], (202, 151, 103))
    scene.texture(None)
    scene.smooth(False)
    scene.group(None)

    # 座板と受け木。船内の敷板は一段下げて、座板の下に奥行きを出す。
    floorboards = ((-0.06, 0.06, -0.32, 0.32),
                   (0.065, 0.102, -0.24, 0.26),
                   (-0.102, -0.065, -0.24, 0.26))
    for y0, y1, x0, x1 in floorboards:
        flat_box(scene, (x0, y0, -0.066, x1, y1, -0.049), WOOD, WOOD_TEXTURE)
    for x0, width in ((-0.25, 0.14), (0.16, 0.13)):
        for y in (-width, width - 0.035):
            flat_box(scene, (x0 - 0.008, y, 0.053, x0 + 0.09, y + 0.035, 0.08),
                     WOOD, WOOD_TEXTURE)
        flat_box(scene, (x0, -width, 0.079, x0 + 0.08, width, 0.107), HULL)
    for x in (-0.45, 0.44):
        scene.material("soft1")
        scene.box(x - 0.022, -0.029, 0.083, x + 0.022, 0.029, 0.225, HULL, bevel=0.008)

    if cargo:
        crate(scene)

    # 見本のように船首を右奥へ向け、船の中央は同じ描画基準点に置く。
    angle = radians(-15)

    def turn(p):
        x, y, z = p
        return np.array((x * cos(angle) - y * sin(angle),
                         x * sin(angle) + y * cos(angle), z))

    scene.t = [(turn(a), turn(b), turn(c), color, part) for a, b, c, color, part in scene.t]
    return scene


def crate(scene):
    # 木箱の周囲を枠で囲み、ふたと手前の板に斜めの補強材を入れる。
    flat_box(scene, (-0.079, -0.087, -0.049, 0.131, 0.087, 0.153), WOOD, WOOD_TEXTURE)
    for x in (-0.085, 0.112):
        for y in (-0.093, 0.069):
            flat_box(scene, (x, y, -0.049, x + 0.025, y + 0.024, 0.176), RIM, WOOD_TEXTURE)
    for y in (-0.092, 0.069):
        flat_box(scene, (-0.081, y, 0.148, 0.134, y + 0.023, 0.176), RIM, WOOD_TEXTURE)
    for x in (-0.083, 0.111):
        flat_box(scene, (x, -0.072, 0.148, x + 0.023, 0.070, 0.176), RIM, WOOD_TEXTURE)
    scene.material("soft1")
    scene.beam((-0.059, -0.062, 0.158), (0.111, 0.063, 0.158), 0.012, RIM)
    scene.beam((-0.058, 0.089, -0.033), (0.112, 0.089, 0.141), 0.011, RIM)


def raft():
    scene = O.Scene()
    scene.smooth(True)
    for i, y in enumerate((-0.135, -0.045, 0.045, 0.135)):
        scene.material("soft1")
        inset = 0.023 * (i % 2)
        start, end = -0.33 + inset, 0.33 - inset
        scene.texture(WOOD_TEXTURE)
        scene.tube([(start, y, 0), (end, y, 0)], 0.049, WOOD, n=12)
        scene.texture(None)
        # 丸太の木口は側面と同じ半径で閉じる。
        for x in (start, end):
            scene.part()
            edge = [(x, y + 0.049 * cos(tau * j / 12), 0.049 * sin(tau * j / 12))
                    for j in range(12)]
            for j in range(12):
                scene.tri((x, y, 0), edge[j], edge[(j + 1) % 12], RIM)
    for x in (-0.21, 0.16):
        flat_box(scene, (x, -0.2, 0.03, x + 0.058, 0.2, 0.084), WOOD, WOOD_TEXTURE)
        scene.material("flat")
        for sign in (-1, 1):
            for offset in (0, 0.017):
                y = sign * (0.145 + offset)
                scene.tube([(x - 0.009, y, 0.014), (x - 0.009, y, 0.073),
                            (x + 0.004, y, 0.088), (x + 0.054, y, 0.088),
                            (x + 0.067, y, 0.073), (x + 0.067, y, 0.014)],
                           0.009, ROPE, n=8)
    return scene


def main(out):
    out.mkdir(parents=True, exist_ok=True)
    O.S = 64
    O.GRAD = True
    O.SMCREASE = cos(radians(80))
    for mask in range(16):
        for label, wet, pool in (("dry", False, False), ("wet", True, False),
                                 ("pond", True, True)):
            render_canal(mask, wet, pool).save(out / f"{label}_m{mask}.png")

    for label, scene in (("boat", boat(False)), ("boat_cargo", boat(True)), ("raft", raft())):
        image = O.render_px(scene, O.game, (-0.5, 0.5, -0.5, 0.5), O.VIEW, merge=10)
        image.save(out / f"{label}.png")

    boats = Image.new("RGBA", (128, 46), "#6c91a7")
    for index, label in enumerate(("boat", "boat_cargo")):
        with Image.open(out / f"{label}.png") as tile:
            boats.alpha_composite(tile.crop((0, 9, 64, 55)), (index * 64, 0))
    boats.resize((512, 184), Image.Resampling.NEAREST).convert("RGB").save(out / "boat_detail_x4.png")

    sheet = Image.new("RGB", (64 * 4, 64 * 12))
    for row, label in enumerate(("dry", "wet", "pond")):
        for i in range(16):
            with Image.open(out / f"{label}_m{i}.png") as tile:
                sheet.paste(tile, ((i % 4) * 64, (row * 4 + i // 4) * 64))
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST).save(out / "masks_x2.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    main(parser.parse_args().output)
