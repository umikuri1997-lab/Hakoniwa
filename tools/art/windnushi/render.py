"""Blender のボーンでポーズをつけ、1マス64ドットで風のヌシ様を写す。"""

import argparse
import json
from math import cos, radians, sin
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import oblique3d as O


# 白い羽のかげはグレーを使わず、すべてのコマで同じ空色を使う。
PLUMAGE = np.array([
    (251, 254, 255), (236, 247, 255), (219, 238, 251),
    (199, 224, 243), (182, 210, 233), (163, 191, 219),
])
LUMA = np.array((0.3, 0.59, 0.11))
SHADE_LEVELS = np.array((253, 245, 231, 217, 201, 180))


def cloud_palette(image):
    pixels = np.array(image)
    red, green, blue, alpha = np.moveaxis(pixels, -1, 0)
    feathers = (alpha != 0) & (red >= 150) & (blue > red)
    lightness = pixels[feathers, :3] @ LUMA
    closest = np.abs(lightness[:, None] - SHADE_LEVELS).argmin(axis=1)
    pixels[feathers, :3] = PLUMAGE[closest]
    eyes = (alpha != 0) & (blue > green) & (red < 100)
    pixels[eyes, :3] = (64, 93, 123)
    return Image.fromarray(pixels)


def frame(parts, colors, heading, bounds):
    sc = O.Scene()
    angle = radians(heading)
    rotation = np.array([
        [cos(angle), sin(angle), 0],
        [-sin(angle), cos(angle), 0],
        [0, 0, 1],
    ])
    for part in parts:
        detail = part["detail"]
        sc.group("details" if detail else "plumage")
        sc.material("flat" if detail else "soft1")
        sc.smooth(not detail)
        sc.outline(k=0.94 if detail else 0.88)
        sc.part()
        vertices = np.asarray(part["vertices"]) @ rotation.T
        color = colors[part["color"]]
        for a, b, c in vertices[part["triangles"]]:
            sc.tri(a, b, c, color)
    return cloud_palette(O.render_px(sc, O.game, bounds, O.VIEW, merge=0))


def main(out):
    out.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as temp:
        geometry = Path(temp) / "poses.json"
        subprocess.run([
            "blender", "-b", "-t", "1", "--python-exit-code", "1",
            "--python", str(HERE / "rig.py"), "--",
            str(out / "windnushi.blend"), str(geometry),
        ], check=True)
        data = json.loads(geometry.read_text())

    O.S = 64
    O.GRAD = True
    O.SMCREASE = cos(radians(80))
    fly = []
    metadata = {}
    for name, parts in data["poses"].items():
        flying = name.startswith("fly_")
        if flying:
            bounds = (-5.25, 5.25, -7, 5)
        elif name == "support":
            bounds = (-5.25, 5.25, -2.75, 2)
        else:
            bounds = (-0.875, 0.875, -0.75, 2)
        image = frame(parts, data["colors"], 25 if flying else 0, bounds)
        crop = image.getbbox()
        assert crop and 0 not in crop[:2] and crop[2] < image.width and crop[3] < image.height, (name, crop)
        if flying:
            fly.append(image)
            crop = (0, 0, image.width, image.height)
        image.crop(crop).save(out / f"{name}.png")
        metadata[name] = {
            "width": crop[2] - crop[0], "height": crop[3] - crop[1],
            "origin_x": round(-bounds[0] * 64) - crop[0],
            "origin_y": round(-bounds[2] * 64) - crop[1],
        }

    (out / "anchors.json").write_text(json.dumps({
        "pixels_per_tile": 64, "milliseconds_per_frame": 100, "frames": metadata,
    }, indent=2) + "\n")
    write_gif(fly, out)


def write_gif(fly, out):
    background = []
    for image in fly:
        canvas = Image.new("RGBA", image.size, "#6488a5")
        canvas.alpha_composite(image)
        background.append(canvas.convert("RGB"))
    background[0].save(out / "flight.gif", save_all=True, append_images=background[1:],
                       duration=100, loop=0, disposal=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    main(parser.parse_args().output.resolve())
