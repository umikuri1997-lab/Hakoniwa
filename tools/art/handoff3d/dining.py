"""H-7 港のカフェの設計図。寸法はマス。B案の貝がらと水色のタイル。

看板は白い柱2本とアーチで吊る。台は幅0.94で、低い什器にタイルを
貼り、奥の柱で布屋根を受ける。献立板は後ろ脚で支える。
舞台は1マスの木床に段をつけ、左右の柱から貝がらを吊るす。
お客さんは形を選ぶための3案と、選ばれた旅の外套の3方向。
"""

import argparse
from math import cos, pi, radians, sin
from pathlib import Path
import sys

import numpy as np

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import oblique3d as O
import matcap


PLANK = (240, 209, 165)
WHITE = (255, 247, 233)
CREAM = (255, 235, 188)
BLUE = (161, 213, 246)
DEEP_BLUE = (143, 195, 231)
TILE_BLUE = (164, 209, 241)
TILE_LIGHT = (190, 226, 249)
SHELL_WHITE = (255, 253, 250)
SHELL_SHADE = (230, 233, 235)
LAMP_WHITE = (255, 251, 228)
LAMP_EDGE = (255, 226, 164)
CORAL = (212, 121, 105)
INK = (61, 76, 93)
WATER = (130, 193, 209)
BRASS = (208, 162, 93)
TEXTURES = Path(__file__).resolve().parents[1] / "textures"
GRAIN = O.Tex(TEXTURES / "wood049.png", dark=(0.16, 0.96), light=(0.12, 1.035))
CLOTH = O.Tex(TEXTURES / "fabric026.png", span=1.3, flow=3, minrun=3,
              dark=(0.13, 0.97), light=(0.11, 1.03))


def block(s, bounds, color, material="soft1", texture=None, bevel=0):
    s.material(material)
    s.texture(texture)
    s.box(*bounds, color, bevel=bevel)
    s.texture(None)


def wood(s, bounds, color=WHITE, bevel=0.012):
    block(s, bounds, color, texture=GRAIN, bevel=bevel)


def plate(s, x, y, z, width, height, color):
    block(s, (x, y, z, x + width, y + 0.018, z + height), color, "flat", bevel=0.006)


def shell(s, x, y, z, radius, lamp=False):
    """貝の一枚の面を5本のすじでふくらませる。"""
    s.material("flat" if lamp else "soft1")
    s.tag("light" if lamp else "clay")
    s.smooth(not lamp)
    s.part()
    direction = -1 if lamp else 1
    for i in range(30):
        points = []
        for j in (i, i + 1):
            f = j / 30
            angle = (0.13 + 0.74 * f) * pi
            reach = radius * (0.90 + 0.10 * sin(pi * f) + 0.065 * cos(10 * pi * f))
            ridge = (1 + cos(10 * pi * f)) * 0.5
            points.append(((x + reach * cos(angle) * 0.54, y + radius * (0.18 + 0.11 * ridge),
                            z + direction * reach * sin(angle) * 0.53),
                           (x + reach * cos(angle), y, z + direction * reach * sin(angle))))
        root = (x, y + 0.009, z)
        ridge = i % 6 in (3, 4)
        color = (LAMP_EDGE if ridge else LAMP_WHITE) if lamp else (SHELL_SHADE if ridge else SHELL_WHITE)
        s.tri(root, points[0][0], points[1][0], color)
        s.quad(points[0][0], points[0][1], points[1][1], points[1][0], color)
    s.smooth(False)
    s.tag(None)


def arch(s, width, height, y, base, thickness):
    s.material("soft1")
    s.smooth(True)
    points = [(width * cos(a), y, base + height * sin(a)) for a in np.linspace(0, pi, 28)]
    s.tube(points, thickness, WHITE, n=10)
    s.smooth(False)


def pillar(s, x, y, low, tops):
    s.material("soft1")
    s.smooth(True)
    s.revolve(x, y, tops, lambda row, _: BLUE if row < 2 and low else WHITE, n=20)
    s.smooth(False)


def sign(s):
    for x in (-0.355, 0.355):
        pillar(s, x, 0.15, True, [(0.089, 0), (0.089, 0.071), (0.073, 0.084),
                                 (0.053, 0.096), (0.053, 0.86), (0.069, 0.89)])
        s.sphere(x, 0.15, 0.924, 0.062, WHITE, n=16, m=10)
    arch(s, 0.355, 0.212, 0.15, 0.86, 0.043)
    arch(s, 0.355, 0.122, 0.15, 0.853, 0.036)
    # 扇形の縁を持つ吊り看板。二本の吊り金具をアーチへつなぐ。
    center = (0, 0.219, 0.565)
    for x in (-0.155, 0.155):
        s.material("metal")
        s.tube([(x, 0.173, 0.952), (x, 0.20, 0.835), (x, 0.218, 0.735)],
               0.013, BRASS)
    for scale, y, color in ((1.0, center[1], WHITE), (0.84, center[1] + 0.016, BLUE)):
        s.material("soft1")
        s.part()
        for j in range(48):
            def point(t):
                flare = 1 + 0.048 * cos(8 * t)
                return (0.285 * cos(t) * flare * scale, y,
                        center[2] + 0.217 * sin(t) * flare * scale)
            s.tri((0, y, center[2]), point(j * pi / 24), point((j + 1) * pi / 24), color)
    shell(s, 0, 0.242, 0.458, 0.237)


def counter(s):
    wood(s, (-0.468, 0.01, 0, 0.468, 0.44, 0.067))
    wood(s, (-0.445, 0.04, 0.06, 0.445, 0.424, 0.50))
    for row in range(3):
        for col in range(8):
            x = -0.437 + 0.109 * col
            z = 0.073 + 0.138 * row
            block(s, (x, 0.397, z, x + 0.098, 0.455, z + 0.125),
                  TILE_BLUE if (row + col) % 3 else TILE_LIGHT, "shiny", bevel=0.018)
    wood(s, (-0.477, 0, 0.482, 0.477, 0.467, 0.548), bevel=0.02)
    for col in range(7):
        for row in range(3):
            x, y = -0.425 + col * 0.123, 0.047 + row * 0.128
            block(s, (x, y, 0.505, x + 0.113, y + 0.117, 0.559), TILE_LIGHT, "shiny", bevel=0.017)
    shell(s, 0, 0.451, 0.142, 0.209)
    for x in (-0.45, 0.38):
        wood(s, (x, 0.003, 0.53, x + 0.07, 0.081, 1.19))
    wood(s, (-0.45, 0.012, 0.74, 0.45, 0.29, 0.788), PLANK)
    wood(s, (-0.48, -0.022, 1.14, 0.48, 0.23, 1.202))
    # しまは同じ曲面の面色で付ける。縫い目で面を切らない。
    s.material("soft1")
    s.texture(CLOTH)
    s.smooth(True)
    s.part()
    profile = ((0.13, 1.151), (0.201, 1.138), (0.266, 1.107),
               (0.314, 1.061), (0.349, 1.014), (0.352, 0.977))
    for j in range(8):
        a = -0.478 + 0.1195 * j
        b = a + 0.1195
        for (y0,z0), (y1,z1) in zip(profile, profile[1:]):
            s.quad((a,y0,z0),(b,y0,z0),(b,y1,z1),(a,y1,z1), WHITE if j % 2 else BLUE)
    s.smooth(False)
    s.texture(None)

    s.material("shiny")
    s.revolve(-0.23, 0.302, [(0, 0.567), (0.072, 0.568), (0.076, 0.579),
                             (0.061, 0.605), (0.098, 0.609), (0.111, 0.626),
                             (0, 0.626)], lambda *_: WHITE, n=20)
    for x in (-0.266, -0.196):
        s.sphere(x, 0.302, 0.648, 0.042, BRASS, n=12, m=8, zs=0.52)
    block(s, (0.10, 0.156, 0.56, 0.35, 0.31, 0.705), WHITE, "shinym", bevel=0.014)
    plate(s, 0.134, 0.312, 0.614, 0.169, 0.047, DEEP_BLUE)
    for x in (0.13, 0.29):
        s.material("shiny")
        s.revolve(x, 0.237, [(0.031, 0.79), (0.037, 0.853), (0.028, 0.852),
                             (0.026, 0.818), (0, 0.817)], lambda *_: WHITE, n=12)


def menu(s):
    for sign in (-1, 1):
        x = sign * 0.287
        s.material("soft1")
        s.texture(GRAIN)
        s.beam((x, 0.32, 0.055), (x, 0.178, 0.88), 0.036, WHITE)
        s.beam((x, -0.034, 0.05), (x, 0.181, 0.847), 0.031, PLANK)
        s.texture(None)
        s.sphere(x, 0.296, 0.052, 0.064, WHITE, n=16, m=8, zs=0.76)
    wood(s, (-0.33, 0.172, 0.14, 0.33, 0.251, 0.842), bevel=0.018)
    arch(s, 0.321, 0.185, 0.219, 0.802, 0.024)
    plate(s, -0.275, 0.255, 0.19, 0.55, 0.653, DEEP_BLUE)
    s.material("flat")
    s.part()
    for a, b in zip(np.linspace(0, pi, 24)[:-1], np.linspace(0, pi, 24)[1:]):
        s.tri((0,0.272,0.802),(0.274*cos(a),0.272,0.802+0.152*sin(a)),
              (0.274*cos(b),0.272,0.802+0.152*sin(b)), DEEP_BLUE)
    shell(s, 0, 0.281, 0.763, 0.145)
    for i, line in enumerate(MENU_LINES):
        menu_line(s, line, 0.685 - 0.124 * i)


# 港のカフェのために作った架空の字形。各行は左から3ドット。
MENU_GLYPHS = (
    ("110", "010", "011", "110", "010"),
    ("010", "111", "010", "011", "001"),
    ("001", "011", "010", "110", "001"),
    ("101", "100", "111", "010", "100"),
    ("100", "110", "011", "010", "011"),
    ("111", "001", "110", "100", "110"),
)
MENU_LINES = ((0, 2, 4, 1), (3, 5, 2), (1, 4, 0), (2, 5, 3, 0))


def menu_line(s, line, top):
    # 字を板の表面に置く。1画は正面から見て1ドットの幅。
    s.material("flat")
    s.outline(0)
    s.part()
    left = -((4 * len(line) - 1) // 2) / 64
    for index, glyph in enumerate(line):
        for row, dots in enumerate(MENU_GLYPHS[glyph]):
            for col, dot in enumerate(dots):
                if dot == "1":
                    x = left + (index * 4 + col) / 64
                    z = top - row / (0.8 * 64)
                    bottom = z - 1 / (0.8 * 64)
                    s.quad((x, 0.275, z), (x + 1/64, 0.275, z),
                           (x + 1/64, 0.275, bottom), (x, 0.275, bottom), WHITE)
    s.outline()


def stage(s):
    wood(s, (-0.469, -0.015, 0, 0.469, 0.53, 0.067), bevel=0.02)
    block(s, (-0.448, 0.003, 0.063, 0.448, 0.506, 0.209), BLUE, bevel=0.02)
    for i in range(10):
        x = -0.448 + 0.090 * i
        wood(s, (x, 0.003, 0.208, x + 0.087, 0.54, 0.244), PLANK, bevel=0.004)
        if i not in (4, 5):
            block(s, (x, 0.499, 0.068, x + 0.08, 0.516, 0.202),
                  DEEP_BLUE if i % 2 else BLUE, "soft1")
    for y, height in ((0.547, 0.153), (0.608, 0.083)):
        wood(s, (-0.158, y - 0.078, 0, 0.158, y + 0.072, height), PLANK)
    for x in (-0.368, 0.368):
        pillar(s, x, 0.075, False, [(0.082, 0.244), (0.082, 0.303), (0.054, 0.319),
                                  (0.054, 0.885), (0.076, 0.893), (0.076, 0.951)])
    arch(s, 0.368, 0.479, 0.075, 0.932, 0.045)
    for x, z0, z1, size in ((-0.204, 1.33, 1.207, 0.13), (0, 1.408, 1.261, 0.172),
                            (0.204, 1.33, 1.207, 0.13)):
        s.material("metal")
        s.tube([(x, 0.075, z0), (x, 0.092, z1)], 0.011, BRASS)
        shell(s, x, 0.098, z1, size, lamp=True)
    s.material("shinym")
    s.revolve(0, 0.295, [(0, 0.244), (0.076, 0.244), (0.076, 0.269),
                         (0.018, 0.287), (0.015, 0.655)], lambda *_: (132, 144, 151), n=14)
    s.sphere(0.027, 0.297, 0.675, 0.044, (161, 171, 175), n=14, m=8, zs=1.37)


def guest(s, design, final=False):
    palettes = [((182, 206, 159), CREAM), ((142, 195, 210), CORAL), ((173, 150, 205), WATER)]
    color, accent = palettes[design]
    s.material("soft1")
    s.smooth(True)
    s.sphere(0, 0, 0.34, 0.35, color, zs=0.95)
    s.sphere(0, 0.011, 0.79, 0.38, color, zs=0.88)
    face_y = 0.182 if final else 0.221
    s.sphere(0, face_y, 0.733, 0.25, CREAM, zs=0.81)
    s.material("flat")
    for x in (-0.10, 0.10):
        # お客さんの絵では、顔の面にのる厚さだけにして横から飛び出さない。
        if final:
            s.sphere(x, face_y + 0.219, 0.755, 0.028, INK, n=12, m=8, zs=1.29)
        else:
            s.sphere(x, 0.445, 0.755, 0.041, INK, n=12, m=6, zs=1.24)
    if design == 0:
        s.sphere(0, 0.005, 0.99, 0.43, accent, zs=0.24)
        s.sphere(0, 0.0, 1.08, 0.24, accent, zs=0.55)
    elif design == 1:
        s.sphere(0, 0.018, 0.56, 0.355, accent, zs=0.2)
        s.sphere(0.23, 0.238, 0.472, 0.11, accent, zs=1.24)
    else:
        s.sphere(0, -0.095, 0.51, 0.405, color, zs=0.85)
        s.sphere(0, 0.36, 0.43, 0.10, accent, zs=0.68)
        s.sphere(0, -0.04, 1.08, 0.16, color, zs=1.21)
        if final:
            # すその板は背側で一枚につなぎ、前の合わせ目は貝の留め具で留める。
            s.material("flat")
            s.sphere(0, 0.423, 0.457, 0.045, CREAM, n=12, m=8, zs=0.74)
            for x in (-0.105, 0.105):
                s.sphere(x, 0.11, 0.072, 0.081, INK, n=12, m=8, zs=0.7)
            s.group("hem")
            s.revolve(0, -0.081, [(0.345, 0.35), (0.399, 0.255),
                                 (0.394, 0.228), (0.361, 0.202)],
                      lambda row, col: accent if row == 1 else color, n=40)


def traveler(heading):
    scene = O.Scene()
    guest(scene, 2, final=True)
    # 正面・よこ・うしろを同じ原点で写す。
    rotation = np.linalg.matrix_power(np.array([[0, 1, 0], [-1, 0, 0], [0, 0, 1]]),
                                      heading)
    scene.t = [(rotation @ a, rotation @ b, rotation @ c, color, part)
               for a, b, c, color, part in scene.t]
    return O.render_px(scene, O.game, (-0.625, 0.625, -1.4, 0.6), O.VIEW,
                       k=0.88, merge=10)


def finish_furniture(tile, scene):
    pixels = np.array(tile)
    # 貝殻だけに白い陶器のマットキャップを使う。
    shells = np.isin(O.LAST_IDS, [pid for pid, tag in scene.tg.items() if tag == "clay"])
    cap = np.asarray(matcap.apply(tile, "clay", steps=8, sat=0.45))
    pixels[shells, :3] = cap[shells, :3]

    # 点灯した貝のまわりに、あたたかい光を薄く足す。
    lights = np.isin(O.LAST_IDS, [pid for pid, tag in scene.tg.items() if tag == "light"])
    if lights.any():
        from scipy.ndimage import distance_transform_edt
        distance = distance_transform_edt(~lights)
        glow = np.digitize(distance, (1.45, 2.5, 3.6))
        strength = np.array((72, 39, 16, 0))[glow]
        halo = (pixels[..., 3] == 0) & (strength > 0)
        pixels[halo, :3] = (255, 229, 167)
        pixels[halo, 3] = strength[halo]
    return Image.fromarray(pixels)


def main(out):
    out.mkdir(parents=True, exist_ok=True)
    O.S = 64
    O.GRAD = True
    O.SMCREASE = cos(radians(80))
    for label, make in (("shopsign", sign), ("counter", counter),
                        ("menuboard", menu), ("stage", stage)):
        scene = O.Scene()
        make(scene)
        tile = O.render_px(scene, O.game, (-0.5, 0.5, -1.25, 1), O.VIEW,
                           k=0.87, outer=False, merge=10)
        finish_furniture(tile, scene).save(out / f"{label}.png")

    O.GRAD = False
    O.SMCREASE = 0.5
    sheet = Image.new("RGBA", (600, 385), "#76969d")
    draw = ImageDraw.Draw(sheet)
    for i in range(3):
        scene = O.Scene()
        guest(scene, i)
        tile = O.render_px(scene, O.game, (-0.55, 0.55, -1.4, 0.55), O.VIEW,
                           k=0.88, merge=10)
        tile = tile.resize((tile.width * 2, tile.height * 2), Image.Resampling.NEAREST)
        sheet.alpha_composite(tile, (30 + i * 200, 34))
        draw.text((30 + i * 200, 290), ("1. Straw hat", "2. Scarf", "3. Travel cloak")[i],
                  fill="white", font_size=18)
    sheet.convert("RGB").save(out / "guest-options.png")

    traveler_sheet = Image.new("RGBA", (576, 286), "#76969d")
    for i, heading in enumerate(("front", "right", "back")):
        image = traveler(i)
        image.save(out / f"guest_{heading}.png")
        zoom = image.resize((image.width * 2, image.height * 2), Image.Resampling.NEAREST)
        traveler_sheet.alpha_composite(zoom, (16 + i * 192, 8))
    traveler_sheet.convert("RGB").save(out / "guest-cloak.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    main(parser.parse_args().output)
