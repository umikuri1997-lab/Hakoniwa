"""コワイノのモーション：体ぜんたいを、足もとを支点に曲げる・つぶす・かたむける（布の体なので、上ほど大きく動く）。
点 P は写すときの向き（x よこ・y 前（カメラのほう）・z 上）、H は体の高さ。
ポーズ（POSES）は、いまのゲームの絵と同じコマ数：待機2・歩き2・攻撃4（ためる → ふりかぶる → たたきつける → もどる）・やられ3（ひるむ → つぶれる → たおれる）。
  bob：上下（高さのうち）・sq：たてのちぢみ（よこは体積がかわらないように広がる）・lean：前へたおす（度、+で前）・roll：よこへかたむける（度、+で右）・bend：曲げのしなり（上ほど大きく曲がる強さ）
  fall：たおれる（度。よこへ）"""
import math
import numpy as np

POSES = {
    'idle': [dict(), dict(sq=0.95, bob=0.0)],
    'walk': [dict(roll=7, bob=0.03, lean=6), dict(roll=-7, bob=0.03, lean=6)],
    'atk': [dict(lean=-14, sq=0.92, roll=5), dict(lean=-20, sq=1.06, bob=0.04), dict(lean=24, sq=0.9, roll=-4), dict(lean=8, sq=0.97)],
    'hurt': [dict(lean=-12, roll=-10, sq=1.03), dict(sq=0.8, roll=6), dict(fall=75, sq=0.9)],
}

def _rot(axis, deg):
    t = math.radians(deg); c, s = math.cos(t), math.sin(t); x, y, z = axis
    return np.array([[c+x*x*(1-c), x*y*(1-c)-z*s, x*z*(1-c)+y*s], [y*x*(1-c)+z*s, c+y*y*(1-c), y*z*(1-c)-x*s], [z*x*(1-c)-y*s, z*y*(1-c)+x*s, c+z*z*(1-c)]])

def pose(P, H, bob=0.0, sq=1.0, lean=0.0, roll=0.0, bend=0.6, fall=0.0):
    P = np.array(P, float); z = np.clip(P[:, 2]/H, 0, 1.2)
    # つぶす：たて sq、よこ・前は 1/√sq（体積をたもつ）。足もとは地面のまま
    w = 1/math.sqrt(sq); P[:, 0] *= w; P[:, 1] *= w; P[:, 2] *= sq
    # 曲げ：高さ z の点を、足もとを支点に、角度×(1-bend+bend*z) だけまわす（上ほど大きく。布のしなり）
    if lean or roll:
        k = (1-bend)+bend*z
        for ax, deg in (((1, 0, 0), -lean), ((0, 1, 0), roll)):   # lean：前（+y）へ
            if not deg: continue
            out = np.empty_like(P)
            for i in range(len(P)): out[i] = _rot(ax, deg*k[i])@P[i]
            P = out
    if fall:   # たおれる：よこへ（体ぜんたいを、かたいまま。うしろへたおすと、すその下の暗い所が見えてしまう）
        P = P@_rot((0, 1, 0), fall).T; P[:, 2] -= P[:, 2].min()
    P[:, 2] += bob*H
    return P
