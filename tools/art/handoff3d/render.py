"""引き継ぎ用の透過 PNG と比較図。チップの登録はしない。"""
import argparse
import json
from math import cos, radians, sin, tau
from pathlib import Path
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ART = HERE.parent
ROOT = ART.parents[1]
sys.path[:0] = [str(ART), str(ART / "furn3d"), str(ART / "kowaino3d")]
import furntone
from kw_tex import bump
import oblique3d as O
from blueprint import Part, build
from furn3d import ELEV, FOV, FRAME, KEEP, LW
from common import WOOD
from rides import CREAM, MODELS, SEATS, SPEED

SCALE = 64
FRAMES = 16
RIDE_ELEV = 29
RIDE_SMOOTH_ANGLE = 80
RIDE_EXT = (-1.93, 1.93, -5.85, 1.01)
SMALL_EXT = (-.70, .70, -1.20, .49)

TEXTURES = ART / "textures"
SURFACES = {
    "wood": O.Tex(TEXTURES / "wood049.png", flow=7, minrun=4,
                  dark=(.23, .82), light=(.16, 1.12)),
    "stone": O.Tex(TEXTURES / "rock030.png", span=.57, flow=3, minrun=3,
                   dark=(.19, .91), light=(.13, 1.06)),
    "metal": O.Tex(TEXTURES / "metal032.png", span=.65, flow=4, minrun=4),
    "cloth": O.Tex(TEXTURES / "fabric026.png", span=.72, flow=5, minrun=4),
}


class Model:
    def __init__(self, faded=False):
        self.sc = O.Scene()
        self.faded = faded

    def color(self, color):
        if not self.faded:
            return color
        return tuple(round(base*.32+paint*.68)
                     for base, paint in zip(color, (178, 168, 151)))

    def material(self, color, smooth, surface):
        surface = "wood" if surface is None and color == WOOD else surface
        self.sc.texture(SURFACES.get("metal" if surface == "polished" else surface))
        # The stone normal map follows world-space surfaces, including cut faces.
        self.sc.bump(self.stone_relief() if surface == "stone" else None)
        finish = {"polished": "metal" if self.faded else "shinym",
                  "enamel": None if self.faded else "shiny",
                  "glass": "glass"}.get(
                      surface, "flat" if color == CREAM else None)
        self.sc.material(finish)
        self.sc.smooth(smooth or surface == "stone")

    def stone_relief(self):
        sample = bump("rock", .65, self.sc.pid)

        def relief(points, normals):
            rough, brightness = sample(points, normals)
            mixed = normals*.46 + rough*.54
            mixed /= np.linalg.norm(mixed, axis=1, keepdims=True)
            return mixed, .36 + brightness*.64

        return relief

    def part(self, color, *, surface=None):
        self.material(color, False, surface)
        self.sc.part()

    def lathe(self, profile, color, x=0, y=0, *, surface=None, detail=40):
        self.material(color, True, surface)
        self.sc.revolve(x, y, profile, lambda *_: self.color(color), n=detail)

    def rod(self, start, end, radius, color, *, surface=None):
        self.material(color, False, surface)
        self.sc.beam(start, end, radius, self.color(color))

    def tube(self, points, radius, color, *, surface=None):
        self.material(color, False, surface)
        self.sc.tube(points, radius, self.color(color))

    def box(self, start, end, color, *, surface=None):
        self.material(color, False, surface)
        self.sc.box(*start, *end, self.color(color), bevel=0)

    def ball(self, center, radius, color, *, surface=None):
        self.material(color, True, surface)
        self.sc.sphere(*center, radius, self.color(color), n=16, m=8)

    def prism(self, points, low, high, color, *, surface=None):
        self.material(color, False, surface)
        build(self.sc, [Part("板", "prism", (points, low, high, "z"),
                             self.color(color))])

    def rock(self, x, y, z, width, height, angle, color):
        self.part(color, surface="stone")
        rings = [[(x+width*r*cos(angle+i*tau/5), y+width*r*sin(angle+i*tau/5),
                   z+dz) for i in range(5)]
                 for r, dz in ((.76, 0), (1, height*.45), (.55, height))]
        for lower, upper in zip(rings, rings[1:]):
            for i in range(5):
                j = (i+1) % 5
                self.sc.quad(lower[i], lower[j], upper[j], upper[i], color)
        for i in range(1, 4):
            self.sc.tri(rings[-1][0], rings[-1][i], rings[-1][i+1], color)

    def yaw(self, first_pid, pivot, angle):
        """指定の部品を座面の中心で水平に回す。"""
        x, y = pivot
        c, s = cos(angle), sin(angle)
        for a, b, d, _, pid in self.sc.t:
            if pid > first_pid:
                for v in (a, b, d):
                    dx, dy = v[0]-x, v[1]-y
                    v[0] = x+dx*c-dy*s
                    v[1] = y+dx*s+dy*c

    def tilt(self, first_pid, pivot, angle):
        x, _, z = pivot
        for a, b, c, _, pid in self.sc.t:
            if pid > first_pid:
                for v in (a, b, c):
                    dx, dz = v[0]-x, v[2]-z
                    v[0] = x+dx*cos(angle)+dz*sin(angle)
                    v[2] = z-dx*sin(angle)+dz*cos(angle)


def render(model, ext, ground, parallel=False, elevation=ELEV, smooth_angle=None):
    project, depth = O.persp(elevation, FOV, None if parallel else FRAME,
                             center=(0, 0, ground), keep=KEEP)
    anchor_y = project((0, ground, 0))[1]

    def projection(point):
        x, y = project(point)
        return x, y-anchor_y

    def ray(ys):
        return project.ray(ys+anchor_y)

    projection.ray = ray
    ext = tuple(round(v*SCALE)/SCALE for v in ext)
    O.S = SCALE
    O.GRAD = True
    crease = O.SMCREASE
    if smooth_angle is not None:
        O.SMCREASE = cos(radians(smooth_angle))
    try:
        image = O.render_px(model.sc, projection, ext, depth, k=.80, k2=.90,
                            lw=LW, merge=0)
    finally:
        O.SMCREASE = crease
    toned = furntone.tone(image, dw=0, streak=(.22, .13),
                         world=furntone.worldlight(KEEP))
    reflective = [pid for pid, finish in O.LAST_MT.items()
                  if finish in {"metal", "shinym", "shiny"}]
    if reflective:
        # 金属・釉薬はレンダラーで求めた反射光を使う。輪郭と透過面は合成済み。
        mask = np.isin(O.LAST_IDS, reflective) & ~O.LAST_LINE & ~O.LAST_CLR
        pixels = np.array(toned)
        pixels[mask] = np.asarray(image)[mask]
        toned = Image.fromarray(pixels)
    image = toned
    anchor = tuple(round(v*SCALE) for v in (ext[0], ext[2]))
    bounds = image.getbbox()
    assert bounds and 0 < bounds[0] < bounds[2] < image.width, (bounds, ext)
    assert 0 < bounds[1] < bounds[3] < image.height, (bounds, ext)
    return image, anchor, projection


def save(image, offset, name, out, metadata):
    filename = name.replace(">", "_dir") + ".png"
    box = image.getbbox()
    image.crop(box).save(out / filename, optimize=True)
    metadata[name] = {"file": filename, "x": offset[0]+box[0],
                      "y": offset[1]+box[1], "w": box[2]-box[0],
                      "h": box[3]-box[1]}


def compare(rows, out, factor):
    """同じ足もとと縮尺で、左に仮の絵、右に3Dから写した絵。"""
    font = ImageFont.load_default()
    xmin = min(x for row in rows for _, (x, _) in row[1:])
    xmax = max(x+im.width for row in rows for im, (x, _) in row[1:])
    col_width = xmax-xmin+16
    y = 21
    strips = []
    for name, old, new in rows:
        top = min(old[1][1], new[1][1])
        bottom = max(im.height+offset[1] for im, offset in (old, new))
        strips.append((name, old, new, y, top))
        y += bottom-top+24
    sheet = Image.new("RGBA", (2*col_width, y), (234, 239, 231, 255))
    draw = ImageDraw.Draw(sheet)
    for col, label in enumerate(("GAME", "3D / g64")):
        draw.text((col*col_width+8, 4), label, font=font, fill="#354749")
    for name, old, new, y, top in strips:
        draw.text((8, y), name, font=font, fill="#354749")
        for col, (im, (x, dy)) in enumerate((old, new)):
            left = col*col_width+8
            draw.line((left, y+15-top, left+col_width-16, y+15-top),
                      fill="#a6b5a7")
            sheet.alpha_composite(im, (left+x-xmin, y+15+dy-top))
    sheet.resize((sheet.width*factor, sheet.height*factor),
                 Image.Resampling.NEAREST).save(out, optimize=True)


def game_image(name, phase=None):
    commands, anchor = json.loads(subprocess.check_output(
        ["node", str(HERE / "placeholder.cjs"), name,
         "null" if phase is None else str(phase)], cwd=ROOT))
    image = Image.new("RGBA", (512, 512))
    zero = (256, 400)
    for x, y, w, h, color, alpha in commands:
        if not color.startswith("#"):
            color, a = color[5:-1].rsplit(",", 1)
            color = "#" + "".join(f"{int(v):02x}" for v in color.split(","))
            alpha *= float(a)
        rgb = Image.new("RGB", (1, 1), color).getpixel((0, 0))
        left, top = round(x-anchor[0])+zero[0], round(y-anchor[1])+zero[1]
        rectangle = Image.new("RGBA", (round(w), round(h)),
                              (*rgb, round(alpha*255)))
        image.alpha_composite(rectangle, (left, top))
    x, y, right, bottom = image.getbbox()
    return image.crop((x, y, right, bottom)), (x-zero[0], y-zero[1])


def palette(images, threshold=12):
    """全コマで共通のパレットを使い、静止部品の色を保つ。"""
    frames = [np.array(im) for im in images]
    pixels = np.concatenate([a[a[:, :, 3] == 255, :3] for a in frames])
    colors, counts = np.unique(pixels, axis=0, return_counts=True)
    rgb = colors.astype(int)
    mapped = np.arange(len(colors))
    for i in np.argsort(-counts, kind="stable"):
        if mapped[i] == i:
            close = ((rgb-rgb[i])**2).sum(axis=1) < threshold**2
            mapped[close & (mapped == np.arange(len(colors)))] = i
    lookup = {tuple(color): colors[mapped[i]] for i, color in enumerate(colors)}
    for frame in frames:
        for color, replacement in lookup.items():
            mask = (frame[:, :, :3] == color).all(axis=2) & (frame[:, :, 3] == 255)
            frame[mask, :3] = replacement
    return frames


def daylight(pixels):
    """昼の散乱光を足す。色相と彩度を保ち、強い光沢は白飛びさせない。"""
    result = pixels.copy()
    visible = result[..., 3] > 0
    rgb = result[visible, :3].astype(float)
    value = rgb.max(axis=1)
    filled = np.interp(value, (0, 48, 96, 144, 192, 224, 255),
                       (0, 65, 132, 190, 225, 245, 255))
    result[visible, :3] = np.rint(rgb*(filled/np.maximum(value, 1))[:, None])
    return result


def rides(out, metadata):
    comparisons = []
    for name, make in MODELS.items():
        images, seats = [], []
        ground = .95 if name in ("merry", "cup") else .81
        for frame in range(FRAMES):
            phase = frame*tau/FRAMES
            model, seat_points = Model(), []
            make(model, phase, False, seat_points)
            im, offset, projection = render(
                model, RIDE_EXT, ground, parallel=True, elevation=RIDE_ELEV,
                smooth_angle=RIDE_SMOOTH_ANGLE)
            images.append(im)
            assert len(seat_points) == SEATS[name]
            seats.append([[round(v*SCALE) for v in projection(point)]
                          for point in seat_points])
        model = Model(faded=True)
        make(model, .6, True, [])
        broken, broken_offset, _ = render(
            model, RIDE_EXT, ground, parallel=True, elevation=RIDE_ELEV,
            smooth_angle=RIDE_SMOOTH_ANGLE)
        assert broken_offset == offset
        *frames, damaged = palette(images+[broken])
        frames = [daylight(frame) for frame in frames]
        stable = np.logical_and.reduce([(frame == frames[0]).all(axis=2)
                                        for frame in frames])
        still = Image.fromarray(np.where(stable[..., None], frames[0], 0))
        save(still, offset, name+"_static", out, metadata)
        sheet = Image.new("RGBA", (4*im.width, 4*im.height))
        motion = Image.new("RGBA", (4*im.width, 4*im.height))
        for i, frame in enumerate(frames):
            full = Image.fromarray(frame)
            patch = Image.fromarray(np.where(stable[..., None], 0, frame))
            np.testing.assert_array_equal(np.asarray(Image.alpha_composite(still, patch)),
                                          frame)
            pos = ((i%4)*im.width, (i//4)*im.height)
            sheet.paste(full, pos)
            motion.paste(patch, pos)
        for suffix, image in (("_frames", sheet), ("_motion", motion)):
            image.save(out / f"{name}{suffix}.png", optimize=True)
        metadata[name] = {"frames": FRAMES, "columns": 4,
                          "cell": [im.width, im.height], "origin": list(offset),
                          "phase_factor": SPEED[name], "seats": seats}
        for suffix, pixels, phase in (("", frames[0], 0.0), ("b", damaged, None)):
            sprite = Image.fromarray(pixels)
            filename = name+suffix
            save(sprite, offset, filename+"_preview", out, metadata)
            x, y, right, bottom = sprite.getbbox()
            comparisons.append((filename, game_image(filename, phase),
                                (sprite.crop((x,y,right,bottom)),
                                 (offset[0]+x, offset[1]+y))))
    return comparisons


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request", choices=("H-1",))
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    metadata = {"g": SCALE}
    make = rides
    rows = make(args.output, metadata)
    compare(rows, args.output / "cmp_x4.png", 4)
    for name, _, (sprite, _) in rows:
        preview = name.replace(">", "_dir") + "_x10.png"
        sprite.resize((sprite.width*10, sprite.height*10),
                      Image.Resampling.NEAREST).save(args.output / preview,
                                                     optimize=True)
    (args.output / "sprites.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2)+"\n")


if __name__ == "__main__":
    main()
