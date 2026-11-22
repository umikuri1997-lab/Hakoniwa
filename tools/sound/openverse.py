#!/usr/bin/env python3
"""Openverse（api.openverse.org）で、ライセンスつきの音をさがす。
つかいかた: python3 tools/sound/openverse.py "footstep grass" [--license cc0,by] [-n 10]
出すのは、名前・ライセンス・作者・ページ・音のURL。使うときは、ページでライセンスをたしかめ、
音のクレジット（creditPop・CREDIT_TXT）に書く。"""
import argparse, json, urllib.parse, urllib.request

ap = argparse.ArgumentParser()
ap.add_argument('q')
ap.add_argument('--license', default='cc0')
ap.add_argument('-n', type=int, default=10)
a = ap.parse_args()
u = 'https://api.openverse.org/v1/audio/?' + urllib.parse.urlencode(
    {'q': a.q, 'license': a.license, 'page_size': a.n})
with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'sound-search'}), timeout=30) as r:
    d = json.load(r)
print(f"{d['result_count']} けん")
for x in d['results']:
    lic = (x.get('license') or '') + ' ' + (x.get('license_version') or '')
    print(f"- {x['title']}  [{lic.strip()}]  {x.get('creator') or ''}  {x.get('duration') or ''}ms")
    print(f"  {x.get('foreign_landing_url')}\n  {x.get('url')}")
