"""Phase 2: validate RollCall text/background token pairs against WCAG 2.2.
Run: python design/check_contrast.py   (exit 1 if any required pair fails)."""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
tok = json.load(open(os.path.join(HERE, "tokens.json")))
raw = {k: v["$value"] for k, v in tok["color"]["raw"].items()}

def resolve(v):
    while v.startswith("{"):
        path = v[1:-1].split(".")
        node = tok
        for p in path:
            node = node[p]
        v = node["$value"]
    return v

def hx(v): v = v.lstrip("#"); return tuple(int(v[i:i+2],16) for i in (0,2,4))
def lin(c):
    c/=255; return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def lum(rgb): r,g,b=[lin(c) for c in rgb]; return 0.2126*r+0.7152*g+0.0722*b
def ratio(a,b):
    la,lb=lum(hx(a)),lum(hx(b)); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)

sem = {k: resolve(v["$value"]) for k, v in tok["color"]["semantic"].items()}
bg, surface, ink = sem["bg"], sem["surface"], sem["ink"]

# (label, fg, bg, min_ratio). Large/bold text can use 3.0; body uses 4.5.
pairs = [
    ("ink on bg", ink, bg, 4.5),
    ("ink on surface", ink, surface, 4.5),
    ("ink-muted on bg", sem["ink-muted"], bg, 4.5),
    ("ink on green fill", ink, raw["green"], 4.5),
    ("ink on lavender fill", ink, raw["lavender"], 4.5),
    ("ink on orange fill", ink, raw["orange"], 4.5),
    ("ink on blue fill", ink, raw["blue"], 4.5),
    ("ink on purple(hero) fill", ink, raw["purple"], 4.5),
    ("ink on peach fill", ink, raw["peach"], 4.5),
    ("ink on pink fill", ink, raw["pink"], 4.5),
    ("safe text on bg", sem["status-safe"], bg, 4.5),
    ("warn text on bg", sem["status-warn"], bg, 4.5),
    ("risk text on bg", sem["status-risk"], bg, 4.5),
    ("safe text on surface", sem["status-safe"], surface, 4.5),
    ("nav-ink on nav-surface", sem["nav-ink"], sem["nav-surface"], 4.5),
]
fail = 0
print(f"{'pair':44} {'ratio':>6}  {'min':>4}  ok")
for label, fg, bgc, mn in pairs:
    r = ratio(fg, bgc); ok = r >= mn
    if not ok: fail += 1
    print(f"{label:44} {r:6.2f}  {mn:>4}  {'YES' if ok else 'NO <-'}")
print(f"\n{'ALL PASS' if not fail else str(fail)+' FAIL'}")
sys.exit(1 if fail else 0)
