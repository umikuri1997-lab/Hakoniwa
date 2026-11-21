"""水の精霊の共通の顔と体を使い、頭巾としっぽの形を比べる。"""
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "spirit3d"))
from core import EXT, Spirit, chip
from rig import shoot

FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
LIGHT = ("#f4d262", "#ffe6a0", "#d9a938")
DARK = ("#8476b7", "#a99bce", "#655691")

# 足もとを原点にした正面の形。頭巾の先、しっぽ、その明るい面。
SHAPES = (
    ("トモリ 1", "ともしび・光のしっぽ", LIGHT,
     [(-19,-67),(-14,-77),(-1,-84),(5,-95),(5,-104),(13,-96),
      (17,-86),(15,-80),(20,-75),(24,-66)],
     [(24,-11),(35,-17),(41,-27),(42,-39),(46,-32),(46,-24),
      (42,-15),(35,-9),(22,-6)],
     [(34,-17),(41,-26),(43,-34),(44,-26),(41,-20),(37,-15)]),
    ("トモリ 2", "朝日・短い光のしっぽ", LIGHT,
     [(-21,-66),(-23,-81),(-14,-79),(-13,-90),(-5,-86),(0,-99),
      (7,-89),(15,-94),(18,-84),(26,-86),(25,-74),(24,-66)],
     [(22,-11),(32,-19),(40,-22),(44,-29),(46,-22),(44,-16),
      (38,-11),(31,-7),(21,-7)],
     [(32,-16),(40,-20),(44,-25),(42,-18),(37,-15)]),
    ("ツキミ 1", "三日月・丸く巻くしっぽ", DARK,
     [(-19,-67),(-13,-78),(-6,-87),(5,-89),(17,-92),(26,-100),
      (25,-92),(20,-85),(14,-82),(19,-77),(24,-66)],
     [(23,-10),(36,-11),(44,-15),(47,-22),(45,-29),(40,-31),
      (37,-28),(37,-24),(33,-27),(34,-32),(39,-36),(46,-35),
      (51,-30),(53,-22),(50,-13),(44,-8),(35,-5),(22,-6)],
     [(40,-13),(46,-17),(49,-22),(48,-28),(49,-27),(51,-21),
      (48,-15),(44,-12)]),
    ("ツキミ 2", "丸頭巾・下へたれるしっぽ", DARK,
     [(-24,-62),(-25,-72),(-21,-81),(-15,-87),(-6,-91),(7,-91),
      (17,-87),(23,-80),(27,-71),(26,-62),(22,-66),(-20,-65)],
     [(23,-9),(33,-15),(42,-15),(47,-12),(50,-7),(49,0),(44,4),
      (45,-4),(42,-8),(35,-9),(23,-5)],
     [(33,-12),(42,-13),(47,-9),(48,-5),(45,-8),(41,-10)]),
)


def points(vertices):
    return [(x-EXT[0], y-EXT[2]) for x, y in vertices]


def preview(base, hood, style):
    _, _, colors, tip, tail, glint = style
    fill, light, shade = colors
    lower = Image.new("RGBA", base.size)
    draw = ImageDraw.Draw(lower)
    draw.polygon(points(tail), fill=shade)
    draw.polygon(points(glint), fill=fill)
    pixels = np.array(base)
    pixels[hood, :3] = tuple(bytes.fromhex(fill[1:]))
    lower.alpha_composite(Image.fromarray(pixels))
    # 先と頭巾をつなぎ、元の顔と体のドットは同じ位置に残す。
    top = Image.new("RGBA", base.size)
    ImageDraw.Draw(top).polygon(points(tip), fill=fill)
    top_pixels = np.array(top)
    inner = np.asarray(top.getchannel("A").filter(ImageFilter.MinFilter(9))) > 0
    inner[-78-EXT[2]:] = False
    top_pixels[inner, :3] = tuple(bytes.fromhex(light[1:]))
    fixed = (pixels[:, :, 3] > 0) & ~hood
    top_pixels[fixed] = 0
    lower.alpha_composite(Image.fromarray(top_pixels))
    np.testing.assert_array_equal(np.array(lower)[fixed], np.array(base)[fixed])
    return lower


def with_face(sprite):
    eyes, x, y = chip("sp:face#n")
    sprite.alpha_composite(Image.fromarray(eyes), (x-EXT[0], y-EXT[2]))
    return sprite


def main():
    spirit = Spirit("water")
    pose = {"bN": .35, "bF": .35}
    original = with_face(Image.fromarray(shoot(spirit, 0, pose)[0]))
    spirit.tops = []
    spirit.cache[0] = {}
    body = Image.fromarray(shoot(spirit, 0, pose)[0])
    pixels = np.array(body)
    hood = np.all(pixels[:, :, :3] == (120, 195, 251), axis=2)
    assert hood.any()
    options = [("水の精霊", "今の顔と体の見本", original)] + [
        (style[0], style[1], with_face(preview(body, hood, style)))
        for style in SHAPES
    ]

    sheet = Image.new("RGB", (1120, 367), "#eeeae3")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(FONT, 20, index=0)
    label_font = ImageFont.truetype(FONT, 15, index=0)
    draw.text((30, 18), "精霊の顔と体  /  頭巾としっぽの案", fill="#3d3447", font=font)
    for i, (name, label, sprite) in enumerate(options):
        x = 22 + 218*i
        background = ("#e1eaed", "#fff3d7", "#fff3d7", "#eae3f3", "#eae3f3")[i]
        draw.rounded_rectangle((x, 55, x+203, 345), radius=12, fill=background)
        draw.text((x+14, 67), name, fill="#3d3447", font=font)
        draw.text((x+14, 321), label, fill="#3d3447", font=label_font)
        art = sprite.crop((26, 13, 130, 131))
        art = art.resize((art.width*2, art.height*2), Image.Resampling.NEAREST)
        sheet.paste(art, (x-5, 84), art)
    sheet.save(Path(sys.argv[1]), optimize=True)


if __name__ == "__main__":
    main()
