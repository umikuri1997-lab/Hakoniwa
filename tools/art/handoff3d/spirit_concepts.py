"""現行コカゲの正面チップに、頭巾としっぽの案を重ねる。"""
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools"))
from chips import load_imgs

PAD = (14, 15)
CELL = (72, 64)
FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"

# 輪郭、地色、光の順。座標はコカゲのチップの左上が原点。
LIGHT = ("#795755", "#e3ac61", "#ffe2a1")
DARK = ("#382b51", "#776299", "#a696c1")
SHAPES = [
    ("トモリ 1", "ともしび・光のしっぽ", LIGHT,
     [(9, 10), (13, 5), (20, 1), (23, -6), (21, -11), (27, -7),
      (29, -1), (28, 3), (31, 7), (33, 11), (25, 9), (16, 8)],
     [(13, 7), (22, 1), (25, -6), (26, -2), (25, 3), (29, 8), (22, 6)],
     [(25, 36), (35, 33), (43, 29), (48, 22), (47, 29), (43, 35),
      (37, 38), (27, 39)],
     [(35, 35), (43, 31), (46, 27), (43, 33), (38, 36)]),
    ("トモリ 2", "朝日・短い光のしっぽ", LIGHT,
     [(8, 11), (8, 5), (13, 6), (14, -2), (20, 2), (23, -6), (27, 2),
      (32, -1), (32, 6), (36, 5), (34, 12), (25, 9), (16, 8)],
     [(12, 8), (16, 8), (16, 2), (21, 5), (23, -2), (26, 5), (30, 3),
      (30, 9), (23, 7), (18, 7)],
     [(26, 36), (36, 33), (43, 32), (45, 29), (47, 33), (46, 36),
      (41, 39), (35, 39), (28, 40)],
     [(37, 35), (43, 34), (45, 32), (44, 36), (40, 37)]),
    ("ツキミ 1", "三日月・丸く巻くしっぽ", DARK,
     [(8, 11), (12, 5), (18, 1), (27, -2), (33, -5), (35, -9), (35, -4),
      (32, 1), (29, 3), (33, 7), (35, 12), (26, 9), (16, 8)],
     [(12, 8), (18, 3), (29, -1), (32, -3), (30, 1), (25, 4), (19, 6)],
     [(25, 35), (37, 35), (43, 34), (46, 31), (45, 28), (42, 28),
      (42, 31), (40, 30), (40, 27), (43, 25), (47, 26), (50, 30),
      (49, 34), (44, 39), (36, 40), (26, 39)],
     [(42, 36), (47, 32), (47, 29), (48, 31), (47, 35), (44, 37)]),
    ("ツキミ 2", "丸頭巾・下へたれるしっぽ", DARK,
     [(7, 15), (8, 8), (13, 2), (19, -2), (26, -2), (33, 1), (37, 6),
      (38, 14), (36, 18), (33, 14), (31, 10), (25, 8), (16, 8)],
     [(11, 7), (15, 3), (21, 0), (26, 0), (32, 3), (34, 6), (28, 4),
      (22, 3), (16, 5)],
     [(26, 35), (37, 34), (43, 35), (47, 38), (48, 42), (46, 45),
      (42, 46), (44, 43), (43, 40), (38, 38), (26, 40)],
     [(37, 36), (43, 36), (47, 40), (47, 42), (44, 39), (41, 38)]),
]


def points(vertices):
    return [(x+PAD[0], y+PAD[1]) for x, y in vertices]


def variant(base, colors, hood, hood_light, tail, tail_light):
    out = Image.new("RGBA", CELL)
    draw = ImageDraw.Draw(out)
    edge, fill, glow = colors
    draw.polygon(points(tail), fill=fill, outline=edge)
    draw.polygon(points(tail_light), fill=glow)
    front = base.copy()
    for y, right in ((19, 35), (20, 36), (21, 36), (22, 36),
                     (23, 35), (24, 34), (25, 33)):
        # 現行の頭巾の後ろにある房を、新しい形に置きかえる。
        front.paste((0, 0, 0, 0), (right, y, front.width, y+1))
    out.alpha_composite(front, PAD)
    draw.polygon(points(hood), fill=fill, outline=edge)
    draw.polygon(points(hood_light), fill=glow)
    # マント、足、目がそのままであることを原画と照合。
    for row, start, end in [(y, 2, 37) for y in range(26, 45)] + [
                            (y, 10, 28) for y in range(12, 26)]:
        for col in range(start, end):
            original = base.getpixel((col, row))
            if original[3]:
                out.putpixel((col+PAD[0], row+PAD[1]), original)
    return out


def main():
    _, chips = load_imgs()
    chip = chips["kg_basic:idle"]
    original = chip["f"][0].convert("RGBA").crop((0, 0, chip["w"], chip["h"]))
    original_cell = Image.new("RGBA", CELL)
    original_cell.alpha_composite(original, PAD)

    sheet = Image.new("RGB", (1120, 315), "#eeeae3")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(FONT, 20, index=0)
    label_font = ImageFont.truetype(FONT, 15, index=0)
    draw.text((30, 18), "コカゲの顔と体を使う", fill="#3d3447", font=font)
    options = [("コカゲ", "いまの絵", original_cell)] + [
        (name, label, variant(original, colors, *shape))
        for name, label, colors, *shape in SHAPES
    ]
    for i, (name, label, sprite) in enumerate(options):
        x = 22 + 218*i
        background = ("#e5e2e4", "#fff3d7", "#fff3d7", "#eae3f3", "#eae3f3")[i]
        draw.rounded_rectangle((x, 55, x+203, 293), radius=12, fill=background)
        draw.text((x+14, 67), name, fill="#3d3447", font=font)
        draw.text((x+14, 264), label, fill="#3d3447", font=label_font)
        preview = sprite.resize((CELL[0]*3, CELL[1]*3), Image.Resampling.NEAREST)
        sheet.paste(preview, (x-12, 85), preview)
    output = Path(sys.argv[1])
    sheet.save(output, optimize=True)


if __name__ == "__main__":
    main()
