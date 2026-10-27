"""Phase 2 helper: extract a representative palette from each reference screenshot.
Run: python design/sample_colors.py  (reads design/references/S*.jpg)
Prints the top clustered colours per image as hex. Approximate (JPEG), for tokens.json seeding."""
import sys, os
from collections import Counter
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "references")

def quantize(img, n=12):
    im = img.convert("RGB").resize((160, 160))
    q = im.quantize(colors=n, method=Image.FASTOCTREE)
    pal = q.getpalette()
    counts = Counter(q.getdata())
    total = sum(counts.values())
    out = []
    for idx, cnt in counts.most_common(n):
        r, g, b = pal[idx*3:idx*3+3]
        out.append((f"#{r:02X}{g:02X}{b:02X}", round(100*cnt/total, 1)))
    return out

for n in (1, 2, 3, 4):
    p = os.path.join(REF, f"S{n}.jpg")
    if not os.path.exists(p):
        print(f"S{n}: missing"); continue
    print(f"\nS{n}.jpg:")
    for hexv, pct in quantize(Image.open(p)):
        print(f"  {hexv}  {pct:>5}%")
