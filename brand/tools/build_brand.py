#!/usr/bin/env python3
"""RockLeak brand generator.

Builds every logo SVG in ../logos and the presentation board ../board.html.
All geometry is hand-specified here (no fonts, no rasters): the ROCKLEAK
wordmark is a custom heavy grotesque drawn as outlines on a 100-unit cap height.

Run:  python3 -I brand/tools/build_brand.py
"""
import base64
import math
import os
import re

BRAND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGOS = os.path.join(BRAND, "logos")

# ---------------------------------------------------------------- palette
INK = "#0B0D10"        # Bedrock Ink
GRAPHITE = "#1C2027"
SLATE = "#5B6573"
STONE = "#AEB5BF"
PAPER = "#F4F2ED"      # Newsprint
WHITE = "#FFFFFF"
RED = "#E5252A"        # Signal Red
BLUE = "#2E6FF2"       # Leak Blue
BLUE_GLOW = "#9CC0FF"  # Leak Blue tint (crack core / glow)
RED_GLOW = "#FF8A7A"


def f(v):
    s = "%.2f" % v
    s = s.rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def poly(points):
    return "M" + " L".join("%s,%s" % (f(x), f(y)) for x, y in points) + " Z"


def lerp(a, b, t):
    return a + (b - a) * t


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb2hex(c):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v))) for v in c)


def ramp(stops, t):
    t = max(0.0, min(1.0, t))
    n = len(stops) - 1
    i = min(int(t * n), n - 1)
    lt = t * n - i
    a, b = hex2rgb(stops[i]), hex2rgb(stops[i + 1])
    return rgb2hex(tuple(lerp(a[k], b[k], lt) for k in range(3)))


def intersect(p1, d1, p2, d2):
    """Intersection of p1 + t*d1 and p2 + s*d2."""
    det = d1[0] * (-d2[1]) - d1[1] * (-d2[0])
    t = ((p2[0] - p1[0]) * (-d2[1]) - (p2[1] - p1[1]) * (-d2[0])) / det
    return (p1[0] + t * d1[0], p1[1] + t * d1[1])


def ellipse(cx, cy, rx, ry, cw=True):
    """Closed ellipse as two arcs; cw=True draws clockwise on screen."""
    s = 1 if cw else 0
    return ("M%s,%s A%s,%s 0 1 %d %s,%s A%s,%s 0 1 %d %s,%s Z" % (
        f(cx - rx), f(cy), f(rx), f(ry), s, f(cx + rx), f(cy),
        f(rx), f(ry), s, f(cx - rx), f(cy)))


def drop(cx, top, r):
    """Teardrop with its tip at (cx, top). Total height = 3.1 * r."""
    cy = top + 2.1 * r
    return ("M%s,%s C%s,%s %s,%s %s,%s A%s,%s 0 0 1 %s,%s C%s,%s %s,%s %s,%s Z" % (
        f(cx), f(top),
        f(cx + 0.3 * r), f(top + 0.75 * r), f(cx + r), f(top + 1.3 * r), f(cx + r), f(cy),
        f(r), f(r), f(cx - r), f(cy),
        f(cx - r), f(top + 1.3 * r), f(cx - 0.3 * r), f(top + 0.75 * r), f(cx), f(top)))


def star(cx, cy, r, inner=0.40, rot=-90):
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(rot + i * 36)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return poly(pts)


# ------------------------------------------------------------ wordmark
# Custom heavy grotesque. Cap height 100, stems 22, horizontals 19.
def glyph_R():
    outer = "M0,0 H38 C57,0 68,11 68,29 C68,42 61,51 50,55 L70,100 H46 L28,58 H22 V100 H0 Z"
    counter = "M22,19 V40 H37 C43.5,40 46.5,36 46.5,29.5 C46.5,23 43.5,19 37,19 Z"
    return outer + " " + counter, 70


def glyph_O():
    return ellipse(42, 50, 42, 51, True) + " " + ellipse(42, 50, 20, 32, False), 84


def glyph_C():
    cx, cy, rx, ry, irx, iry, dy = 42, 50, 42, 51, 20, 32, 21
    ox = cx + rx * math.sqrt(1 - (dy / ry) ** 2)
    ix = cx + irx * math.sqrt(1 - (dy / iry) ** 2)
    d = ("M%s,%s A%s,%s 0 1 0 %s,%s L%s,%s A%s,%s 0 1 1 %s,%s Z" % (
        f(ox), f(cy - dy), f(rx), f(ry), f(ox), f(cy + dy),
        f(ix), f(cy + dy), f(irx), f(iry), f(ix), f(cy - dy)))
    return d, ox


def glyph_K():
    arm_top_l, arm_top_r = (47, 0), (72, 0)
    arm_dir = (-25, 38)                      # direction of the upper arm, going down-left
    crotch = (72 - 25 * 40 / 38, 40)         # where the leg leaves the arm
    leg_br, leg_bl = (75, 100), (50, 100)
    leg_dir = (leg_br[0] - crotch[0], leg_br[1] - crotch[1])
    p = intersect(leg_bl, (-leg_dir[0], -leg_dir[1]), arm_top_r, arm_dir)
    q = intersect(arm_top_r, arm_dir, (22, 0), (0, 1))
    pts = [(0, 0), (22, 0), (22, 38), arm_top_l, arm_top_r, crotch, leg_br, leg_bl, p, q, (22, 100), (0, 100)]
    return poly(pts), 75


def glyph_L():
    return "M0,0 H22 V81 H56 V100 H0 Z", 56


def glyph_E():
    return "M0,0 H56 V19 H22 V40.5 H52 V59.5 H22 V81 H58 V100 H0 Z", 58


def glyph_A():
    s = 0.27
    il = lambda y: 23 + s * (100 - y)   # inner-left edge x at height y
    ir = lambda y: 80 - il(y)
    outer = poly([(27, 0), (53, 0), (80, 100), (57, 100), (ir(81), 81), (il(81), 81), (23, 100), (0, 100)])
    apex_y = 100 - (40 - 23) / s
    counter = poly([(40, apex_y), (il(62), 62), (ir(62), 62)])  # CCW
    return outer + " " + counter, 80


GLYPHS = {"R": glyph_R, "O": glyph_O, "C": glyph_C, "K": glyph_K,
          "L": glyph_L, "E": glyph_E, "A": glyph_A}
# Hand-kerned gaps (units) after each letter of R O C K | L E A K
GAPS = [6, 5, 7, 6, 4, 4, 3, 0]


def place(d, dx):
    """Translate a path (absolute M/L/H/V/C/A/Z commands only) horizontally by dx."""
    toks = re.findall(r"[A-Za-z]|-?\d*\.?\d+", d)
    res, cmd, buf = [], None, []

    def flush():
        if cmd is None:
            return
        nums = [float(x) for x in buf]
        if cmd in "MLC":
            nums = [n + dx if k % 2 == 0 else n for k, n in enumerate(nums)]
        elif cmd == "H":
            nums = [n + dx for n in nums]
        elif cmd == "A":
            nums = [n + dx if k % 7 == 5 else n for k, n in enumerate(nums)]
        res.append(cmd + ",".join(f(n) for n in nums))

    for t in toks:
        if t.isalpha():
            flush()
            cmd, buf = t, []
        else:
            buf.append(t)
    flush()
    return " ".join(res)


def wordmark(split_gap=0):
    """Returns (rock_d, leak_d, total_width, (leak_x0, leak_x1)) in 100-unit space."""
    x = 0
    rock, leak = [], []
    leak_x0 = None
    for i, ch in enumerate("ROCKLEAK"):
        d, adv = GLYPHS[ch]()
        if i == 4:
            x += split_gap
            leak_x0 = x
        (rock if i < 4 else leak).append(place(d, x))
        x += adv + GAPS[i]
    return " ".join(rock), " ".join(leak), x, (leak_x0, x)


# ------------------------------------------------------------ marks
# Each mark function returns (defs, body) in a 512x512 space.

def mark_faultline(dark=False, uid="c1"):
    """Concept 1: faceted bedrock split by a glowing fault that leaks one drop."""
    P = [(150, 58), (330, 42), (440, 138), (458, 262), (376, 352), (262, 392),
         (140, 348), (60, 250), (78, 140)]
    A, B, C, D, E = (232, 128), (350, 162), (176, 238), (326, 262), (240, 322)
    tris = [  # (points, tone index 0=lightest .. 4=darkest)
        ([P[0], P[1], A], 0), ([P[8], P[0], A], 1), ([P[1], B, A], 1), ([P[1], P[2], B], 2),
        ([P[8], A, C], 2), ([P[7], P[8], C], 1), ([A, B, D], 2), ([A, D, C], 3),
        ([P[7], C, P[6]], 3), ([C, D, E], 3), ([C, E, P[6]], 4), ([P[6], E, P[5]], 4),
        ([B, P[2], P[3]], 3), ([B, P[3], D], 3), ([D, P[3], P[4]], 4), ([D, P[4], E], 4),
        ([E, P[4], P[5]], 4),
    ]
    tones = (["#F7F7F5", "#E3E6EA", "#C9CED6", "#AAB2BD", "#8C95A2"] if dark else
             ["#48515D", "#343B45", "#242930", "#171A20", INK])
    crack = [(252, 24, 26), (224, 138, 19), (284, 226, 13), (244, 318, 7), (262, 396, 1)]
    left = [(x - w, y) for x, y, w in crack]
    right = [(x + w, y) for x, y, w in crack][::-1]
    core_l = [(x - w * 0.42, y) for x, y, w in crack]
    core_r = [(x + w * 0.42, y) for x, y, w in crack][::-1]
    defs = '<clipPath id="%s-rock"><path d="%s"/></clipPath>' % (uid, poly(P))
    body = ['<path d="%s" fill="%s"/>' % (poly(P), tones[3])]
    for pts, t in tris:
        body.append('<path d="%s" fill="%s"/>' % (poly(pts), tones[t]))
    body.append('<g clip-path="url(#%s-rock)">' % uid)
    body.append('<path d="%s" fill="%s"/>' % (poly(left + right), BLUE))
    body.append('<path d="%s" fill="%s"/>' % (poly(core_l + core_r), BLUE_GLOW if not dark else WHITE))
    body.append('</g>')
    body.append('<path d="%s" fill="%s"/>' % (drop(262, 408, 23), BLUE))
    return defs, "\n".join(body)


def mark_monogram(dark=False, uid="c2"):
    """Concept 2: chiselled R, split by a fault; one red drop falls from the bowl."""
    ink = PAPER if dark else INK
    leg_dir = (74, 188)
    leg_l_top = (312 - leg_dir[0] * (154 / 188), 286)
    outer = poly([(118, 94), (140, 72), (316, 72), (382, 124), (382, 200), (336, 252),
                  (410, 440), (312, 440), leg_l_top, (214, 286), (214, 440), (140, 440), (118, 418)])
    counter = "M214,146 V214 H290 L308,196 V164 L290,146 Z"
    crack = "302,40 284,108 296,150 268,212 252,244 264,266 248,300"
    defs = ('<mask id="%s-crack" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">'
            '<rect width="512" height="512" fill="#fff"/>'
            '<polyline points="%s" fill="none" stroke="#000" stroke-width="12" '
            'stroke-linejoin="miter" stroke-miterlimit="10"/></mask>') % (uid, crack)
    body = ('<path d="%s %s" fill="%s" fill-rule="evenodd" mask="url(#%s-crack)"/>\n'
            '<path d="%s" fill="%s"/>') % (outer, counter, ink, uid, drop(243, 304, 19), RED)
    return defs, body


def mark_globe(dark=False, uid="c3"):
    """Concept 3: a faceted stone globe, split along a fault into two equal halves."""
    R, cx, cy = 196, 256, 252
    tilt = math.radians(16)
    lats = [90, 72, 48, 24, 0, -24, -48, -72, -90]
    step = 30
    lons = list(range(-180, 180, step))
    jig = {72: 4, 48: 9, 24: -9, 0: 9, -24: -9, -48: 9, -72: -4}

    def v3(lat, lon):
        if lon == 0 and lat in jig:
            lon += jig[lat]
        la, lo = math.radians(lat), math.radians(lon)
        x, y, z = math.cos(la) * math.sin(lo), -math.sin(la), math.cos(la) * math.cos(lo)
        y2 = y * math.cos(tilt) + z * math.sin(tilt)
        z2 = -y * math.sin(tilt) + z * math.cos(tilt)
        return (x, y2, z2)

    L = (0.0, -0.55, 0.84)
    ln = math.sqrt(sum(c * c for c in L))
    L = tuple(c / ln for c in L)
    blue = ["#0A1B45", "#112F78", "#1A47AE", "#2763E0", "#4F86F7"]
    red = ["#430A0C", "#7C1216", "#B31B20", "#DC2429", "#EE5753"]
    halves = {"l": [], "r": []}
    for i in range(len(lats) - 1):
        for j, lo in enumerate(lons):
            lo2 = lo + step
            quad = [v3(lats[i], lo), v3(lats[i], lo2), v3(lats[i + 1], lo2), v3(lats[i + 1], lo)]
            # de-duplicate polar vertices
            q = []
            for p in quad:
                if not q or max(abs(p[k] - q[-1][k]) for k in range(3)) > 1e-9:
                    q.append(p)
            if max(abs(q[0][k] - q[-1][k]) for k in range(3)) < 1e-9:
                q.pop()
            n = [sum(p[k] for p in q) / len(q) for k in range(3)]
            nl = math.sqrt(sum(c * c for c in n))
            n = [c / nl for c in n]
            if n[2] <= 0.0:
                continue
            light = max(0.0, sum(n[k] * L[k] for k in range(3)))
            side = "l" if math.sin(math.radians(lo + step / 2)) < 0 else "r"
            halves[side].append(([(cx + R * p[0], cy + R * p[1]) for p in q], light, n[2]))

    pivot = (cx, cy + R)

    def xf(pts, dx, ang):
        a = math.radians(ang)
        out = []
        for x, y in pts:
            x0, y0 = x - pivot[0], y - pivot[1]
            out.append((pivot[0] + x0 * math.cos(a) - y0 * math.sin(a) + dx,
                        pivot[1] + x0 * math.sin(a) + y0 * math.cos(a)))
        return out

    body = []
    for side, stops, dx, ang in (("l", blue, -8, -2.2), ("r", red, 8, 2.2)):
        g = []
        for pts, light, z in sorted(halves[side], key=lambda t: t[2]):
            t = (light - 0.25) / 0.75
            g.append('<path d="%s" fill="%s" stroke="%s" stroke-width="1" stroke-linejoin="round"/>' % (
                poly(xf(pts, dx, ang)), ramp(stops, t), ramp(stops, t)))
        body.append("<g>\n" + "\n".join(g) + "\n</g>")
    return "", "\n".join(body)


def mark_capitol(dark=False, uid="c4"):
    """Concept 4: a chiselled Capitol dome, split by a fault that leaks one red drop."""
    cx = 256
    tones = (["#FFFFFF", "#ECEAE4", "#D6D3CB", "#BDBAB2"] if dark else
             ["#3A424D", "#262B33", "#171A20", INK])
    solid = PAPER if dark else INK
    rx, ry, by = 106, 122, 238
    lams = [-90, -60, -30, 0, 30, 60, 90]
    phis = [0, 22, 44, 66, 72]
    parts = []
    for i in range(len(lams) - 1):
        a, b = math.radians(lams[i]), math.radians(lams[i + 1])
        left = [(cx + rx * math.cos(math.radians(p)) * math.sin(a), by - ry * math.sin(math.radians(p))) for p in phis]
        right = [(cx + rx * math.cos(math.radians(p)) * math.sin(b), by - ry * math.sin(math.radians(p))) for p in phis]
        tone = [1, 0, 1, 2, 3, 3][i]
        parts.append('<path d="%s" fill="%s"/>' % (poly(left + right[::-1]), tones[tone]))
    top_y = by - ry * math.sin(math.radians(72))
    # lantern, cap and spire
    ring = top_y - 30
    parts.append('<rect x="239" y="%s" width="34" height="%s" fill="%s"/>' % (f(ring + 6), f(top_y + 2 - ring - 6), solid))
    parts.append('<rect x="233" y="%s" width="46" height="8" fill="%s"/>' % (f(ring), solid))
    parts.append('<path d="M239,%s A17,20 0 0 1 273,%s Z" fill="%s"/>' % (f(ring + 1), f(ring + 1), solid))
    parts.append('<path d="M256,%s L263,%s H249 Z" fill="%s"/>' % (f(ring - 40), f(ring - 14), solid))
    # attic ring, drum with colonnade, cornice, steps
    parts.append('<rect x="140" y="%s" width="232" height="18" fill="%s"/>' % (f(by - 2), solid))
    cols = []
    x0, x1, n_slots, slot = 130, 382, 8, 11
    col_w = (x1 - x0 - n_slots * slot) / (n_slots + 1)
    drum = "M%s,254 H%s V316 H%s Z" % (x0, x1, x0)
    for k in range(n_slots):
        sx = x0 + col_w * (k + 1) + slot * k
        cols.append("M%s,266 V306 H%s V266 Z" % (f(sx), f(sx + slot)))
    parts.append('<path d="%s %s" fill="%s" fill-rule="evenodd"/>' % (drum, " ".join(cols), solid))
    parts.append('<rect x="114" y="316" width="284" height="16" fill="%s"/>' % solid)
    parts.append('<rect x="98" y="332" width="316" height="16" fill="%s"/>' % solid)
    parts.append('<rect x="82" y="348" width="348" height="16" fill="%s"/>' % solid)
    crack = "260,%s 250,128 270,190 244,252 264,300 252,368" % f(ring + 2)
    defs = ('<mask id="%s-crack" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">'
            '<rect width="512" height="512" fill="#fff"/>'
            '<polyline points="%s" fill="none" stroke="#000" stroke-width="11" '
            'stroke-linejoin="miter" stroke-miterlimit="10"/></mask>') % (uid, crack)
    stars = []
    for ang in (150, 124, 56, 30):
        a = math.radians(ang)
        stars.append('<path d="%s" fill="%s"/>' % (star(cx + 196 * math.cos(a), 240 - 196 * math.sin(a), 15), BLUE))
    body = ('<g mask="url(#%s-crack)">\n%s\n</g>\n<path d="%s" fill="%s"/>\n%s' % (
        uid, "\n".join(parts), drop(252, 382, 21), RED, "\n".join(stars)))
    return defs, body


def mark_redacted(dark=False, uid="c5"):
    """Concept 5: the flag as a redacted document; one bar cracks open and leaks red light."""
    ink = PAPER if dark else INK
    top, h, g = 70, 44, 22
    rows = [top + k * (h + g) for k in range(6)]
    cant = (56, rows[0], 176, rows[2] + h - rows[0])
    body = []
    body.append('<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>' % (cant[0], cant[1], cant[2], cant[3], BLUE))
    body.append('<path d="%s" fill="%s"/>' % (star(cant[0] + cant[2] / 2, cant[1] + cant[3] / 2 + 6, 60), WHITE))
    for k in range(3):
        body.append('<rect x="254" y="%d" width="202" height="%d" fill="%s"/>' % (rows[k], h, ink))
    y = rows[3]
    # broken bar: left shard | red light | right shard (nudged = forced open)
    lt, lb, gapw = 254, 232, 24          # slant of the break, top/bottom x of left edge
    jag_l = [(lt, y), (lb, y + h)]
    jag_r = [(lt + gapw, y), (lb + gapw, y + h)]
    light = [(lt, y), (lt + gapw / 2 + 4, y - 18), (lt + gapw, y), (lb + gapw, y + h),
             (lb + gapw / 2 - 4, y + h + 18), (lb, y + h)]
    body.append('<path d="%s" fill="%s"/>' % (poly(light), RED))
    body.append('<path d="%s" fill="%s"/>' % (poly([(56, y)] + jag_l + [(56, y + h)]), ink))
    rshard = poly([jag_r[0], (456, y), (456, y + h), jag_r[1]])
    body.append('<path d="%s" fill="%s" transform="rotate(-1.6 456 %d)"/>' % (rshard, ink, y + h))
    body.append('<rect x="56" y="%d" width="400" height="%d" fill="%s"/>' % (rows[4], h, ink))
    body.append('<rect x="56" y="%d" width="286" height="%d" fill="%s"/>' % (rows[5], h, ink))
    return "", "\n".join(body)


CONCEPTS = [
    dict(n=1, slug="faultline", name="Fault Line", fn=mark_faultline, leak=RED, rock=None,
         mark_size=256, mark_dy=0,
         line="A faceted block of bedrock split by a glowing fault that leaks a single drop of light."),
    dict(n=2, slug="monogram", name="Cracked R", fn=mark_monogram, leak=BLUE, rock=None, divider=True,
         mark_size=232, mark_dy=0,
         line="A chiselled stone R, fractured through the bowl; one red drop falls out of the break."),
    dict(n=3, slug="splitworld", name="Split World", fn=mark_globe, leak=None, rock=None,
         mark_size=250, mark_dy=0,
         line="A faceted stone globe forced apart along a fault: blue half, red half, light in between."),
    dict(n=4, slug="capitol", name="Capitol Bedrock", fn=mark_capitol, leak=None, rock=None,
         mark_size=268, mark_dy=0,
         line="The Capitol dome chiselled from stone, cracked top to bottom, leaking one red drop under a band of stars."),
    dict(n=5, slug="redacted", name="Redacted", fn=mark_redacted, leak="bar", rock=None,
         mark_size=228, mark_dy=0,
         line="The flag re-read as a redacted file: black bars for stripes, one bar cracked open and spilling red."),
]


def svg_doc(view_w, view_h, defs, body, title):
    d = "<defs>%s</defs>\n" % defs if defs else ""
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
            'role="img" aria-label="%s">\n<title>%s</title>\n%s%s\n</svg>\n') % (
        view_w, view_h, view_w, view_h, title, title, d, body)


def build_mark(c, dark=False):
    defs, body = c["fn"](dark=dark, uid="c%d%s" % (c["n"], "d" if dark else ""))
    return defs, body


def build_lockup(c, dark=False):
    defs, mbody = build_mark(c, dark)
    ink = PAPER if dark else INK
    W, H = 1200, 300
    cap = 112
    s = cap / 100.0
    split = 22 if c["leak"] == "bar" else 0
    rock_d, leak_d, wm_w, (lx0, lx1) = wordmark(split)
    ms = c["mark_size"]
    gap = 78 if c.get("divider") else 46
    total = ms + gap + wm_w * s
    x0 = (W - total) / 2
    my = (H - ms) / 2 + c["mark_dy"]
    wx = x0 + ms + gap
    wy = (H - cap) / 2
    parts = []
    if dark:
        parts.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, INK))
    parts.append('<g transform="translate(%s %s) scale(%s)">\n%s\n</g>' % (f(x0), f(my), f(ms / 512.0), mbody))
    if c.get("divider"):
        parts.append('<rect x="%s" y="%s" width="4" height="%s" fill="%s" opacity="0.28"/>' % (
            f(x0 + ms + gap / 2 - 2), f(wy - 18), f(cap + 36), ink))
    leak_fill = c["leak"] if c["leak"] not in (None, "bar") else ink
    if c["leak"] == "bar":
        pad_x, pad_y = 12, 14
        parts.append('<g transform="translate(%s %s) scale(%s)">' % (f(wx), f(wy), f(s)))
        parts.append('<path d="%s" fill="%s"/>' % (rock_d, ink))
        parts.append('<rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>' % (
            f(lx0 - pad_x), f(-pad_y), f(lx1 - lx0 + 2 * pad_x - 0), f(100 + 2 * pad_y), ink))
        parts.append('<rect x="%s" y="%s" width="%s" height="6" fill="%s"/>' % (
            f(lx0 - pad_x), f(100 + pad_y - 6), f(lx1 - lx0 + 2 * pad_x), RED))
        parts.append('<path d="%s" fill="%s"/>' % (leak_d, INK if dark else WHITE))
        parts.append('</g>')
    else:
        parts.append('<g transform="translate(%s %s) scale(%s)">\n<path d="%s" fill="%s"/>\n<path d="%s" fill="%s"/>\n</g>' % (
            f(wx), f(wy), f(s), rock_d, ink, leak_d, leak_fill))
    return defs, "\n".join(parts)


def write(path, text):
    with open(path, "w") as fh:
        fh.write(text)


def b64(svg):
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


SIGNALS = {
    1: ["Truth", "Leak", "Bedrock"],
    2: ["Authority", "Leak", "Bedrock"],
    3: ["World", "Every side", "Leak"],
    4: ["Politics", "Leak", "Bedrock"],
    5: ["Politics", "Leak", "Investigative"],
}
RANK = {1: 2, 2: 1, 3: 3, 4: 5, 5: 4}
TAGLINE = "Bedrock facts. Every side."


def build_board(concepts, assets, b64):
    def img(svg, w, h=None, cls=""):
        h = h or w
        return '<img class="%s" src="%s" width="%s" height="%s" alt="">' % (cls, b64(svg), w, h)

    sections = []
    for c in concepts:
        a = assets[c["n"]]
        chips = "".join('<span class="chip">%s</span>' % t for t in SIGNALS[c["n"]])
        sections.append("""
<section class="concept">
  <header class="c-head">
    <div class="c-num">%02d</div>
    <div class="c-title"><h2>%s</h2><p>%s</p></div>
    <div class="c-chips">%s<span class="chip rank">Rank #%d</span></div>
  </header>
  <div class="c-grid">
    <div class="hero tile paper">%s<span class="cap">Mark &middot; 512px</span></div>
    <div class="right">
      <div class="sizes">
        <div class="tile paper size"><div class="row">%s%s%s</div><span class="cap">64 &middot; 32 &middot; 16 on light</span></div>
        <div class="tile ink size"><div class="row">%s%s%s</div><span class="cap">64 &middot; 32 &middot; 16 on dark</span></div>
      </div>
      <div class="tile paper lock">%s<span class="cap">Primary lockup &middot; light</span></div>
      <div class="tile lockdark">%s<span class="cap light">Lockup &middot; dark</span></div>
      <div class="usage">
        <div class="browser light">
          <div class="tabs"><div class="tab">%s<span>RockLeak &mdash; %s</span><i>&times;</i></div><div class="tab ghost"></div></div>
          <div class="bar"><span class="lock-ico"></span>rockleak.com/investigations</div>
        </div>
        <div class="browser dark">
          <div class="tabs"><div class="tab">%s<span>RockLeak &mdash; %s</span><i>&times;</i></div><div class="tab ghost"></div></div>
          <div class="bar"><span class="lock-ico"></span>rockleak.com/world</div>
        </div>
        <div class="apps">
          <div class="app"><div class="icon inkbg">%s</div><span>RockLeak</span></div>
          <div class="app"><div class="icon paperbg">%s</div><span>RockLeak</span></div>
        </div>
      </div>
    </div>
  </div>
</section>""" % (
            c["n"], c["name"], c["line"], chips, RANK[c["n"]],
            img(a["mark"], 440, cls="m512"),
            img(a["mark"], 64), img(a["mark"], 32), img(a["mark"], 16),
            img(a["mark_dark"], 64), img(a["mark_dark"], 32), img(a["mark_dark"], 16),
            img(a["lock"], 600, 150), img(a["lock_dark"], 600, 150),
            img(a["mark"], 16), TAGLINE, img(a["mark_dark"], 16), TAGLINE,
            img(a["mark_dark"], 64), img(a["mark"], 64)))

    swatches = "".join(
        '<div class="sw"><div class="chipc" style="background:%s"></div><b>%s</b><code>%s</code></div>' % (hx, nm, hx)
        for nm, hx in [("Bedrock Ink", INK), ("Graphite", GRAPHITE), ("Slate", SLATE), ("Stone", STONE),
                       ("Newsprint", PAPER), ("Signal Red", RED), ("Leak Blue", BLUE)])
    ranked = sorted(concepts, key=lambda c: RANK[c["n"]])
    ranking = "".join('<li><b>%s</b> <span>%s</span></li>' % (c["name"], c["line"]) for c in ranked)
    top = assets[ranked[0]["n"]]

    return """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RockLeak - Logo Exploration</title>
<link rel="icon" href="%s">
<style>
:root{--ink:%s;--paper:%s;--red:%s;--blue:%s;--graphite:%s;--slate:%s;--line:#E2DFD8}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#E9E6DF;color:var(--ink);font-family:'Inter','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1360px;margin:0 auto;padding:0 40px 80px}
.masthead{background:var(--ink);color:var(--paper);padding:56px 0 48px;margin-bottom:40px}
.masthead .wrap{padding-bottom:0;display:grid;grid-template-columns:1.3fr 1fr;gap:48px;align-items:end}
.kicker{font:700 12px/1 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#8C95A2;display:flex;gap:10px;align-items:center}
.kicker:before{content:"";width:28px;height:4px;background:linear-gradient(90deg,var(--blue) 50%%,var(--red) 50%%)}
.masthead h1{font:800 64px/1.0 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:-.03em;margin:18px 0 14px}
.masthead h1 em{font-style:normal;color:var(--red)}
.masthead p.lede{font:400 19px/1.5 Georgia,'Times New Roman',serif;color:#C9CED6;max-width:640px}
.meta{border-left:1px solid #2A3039;padding-left:28px;display:grid;gap:16px}
.meta h3{font:700 11px/1 'Inter',Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#8C95A2;margin-bottom:8px}
.tagline{font:800 26px/1.15 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:-.01em}
.tagline small{display:block;font:400 15px/1.4 Georgia,serif;color:#AEB5BF;margin-top:6px;letter-spacing:0}
.swatches{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.sw{font-size:10px;color:#AEB5BF}.sw b{display:block;color:var(--paper);font-size:11px;margin-top:6px}
.sw code{font:10px/1.4 'IBM Plex Mono',Menlo,monospace}
.chipc{height:34px;border-radius:6px;border:1px solid #2A3039}
.concept{background:#fff;border-radius:18px;padding:28px;margin-bottom:28px;box-shadow:0 1px 0 rgba(11,13,16,.06),0 12px 40px -24px rgba(11,13,16,.35)}
.c-head{display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center;padding-bottom:22px;border-bottom:1px solid var(--line);margin-bottom:22px}
.c-num{font:800 44px/1 'Inter',Arial,sans-serif;letter-spacing:-.04em;color:var(--red);width:64px}
.c-title h2{font:800 28px/1.1 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:-.02em}
.c-title p{font:400 16px/1.45 Georgia,'Times New Roman',serif;color:#3A424D;margin-top:4px;max-width:720px}
.c-chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.chip{font:700 10px/1 'Inter',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:7px 10px;border-radius:99px;border:1px solid #D6D3CB;color:#3A424D}
.chip.rank{background:var(--ink);color:#fff;border-color:var(--ink)}
.c-grid{display:grid;grid-template-columns:480px 1fr;gap:18px}
.tile{border-radius:12px;position:relative;display:flex;align-items:center;justify-content:center}
.tile .cap{position:absolute;left:14px;bottom:10px;font:700 9.5px/1 'Inter',Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8C95A2}
.paper{background:var(--paper)}.ink{background:var(--ink)}
.hero{height:100%%;min-height:560px}
.right{display:grid;gap:14px;grid-template-rows:auto auto auto auto}
.sizes{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.size{height:116px}.size .row{display:flex;gap:26px;align-items:flex-end;padding-bottom:10px}
.lock{height:170px}.lockdark{height:170px;background:var(--ink)}
.lock img,.lockdark img{width:600px;height:150px}
.cap.light{color:#5B6573}
.usage{display:grid;grid-template-columns:1fr 1fr 190px;gap:14px;align-items:stretch}
.browser{border-radius:10px;overflow:hidden;border:1px solid #D6D3CB}
.browser .tabs{display:flex;align-items:flex-end;gap:4px;padding:8px 8px 0;background:#DEE1E6;height:40px}
.browser .tab{display:flex;align-items:center;gap:8px;background:#fff;border-radius:8px 8px 0 0;padding:0 10px;height:32px;width:250px;font:500 12px/1 'Inter',Arial,sans-serif;color:#1D2128;white-space:nowrap;overflow:hidden}
.browser .tab span{overflow:hidden;text-overflow:ellipsis;flex:1}
.browser .tab i{font-style:normal;color:#5B6573;font-size:14px}
.browser .tab.ghost{width:90px;background:transparent}
.browser .bar{background:#fff;padding:9px 12px;font:12px/1 'Inter',Arial,sans-serif;color:#3A424D;display:flex;gap:8px;align-items:center;border-top:1px solid #eee}
.lock-ico{width:9px;height:10px;border:2px solid #5B6573;border-radius:2px}
.browser.dark{border-color:#2A3039}
.browser.dark .tabs{background:#1C2027}.browser.dark .tab{background:#2A3039;color:#E3E6EA}
.browser.dark .bar{background:#2A3039;color:#C9CED6;border-top-color:#1C2027}
.browser.dark .lock-ico{border-color:#AEB5BF}
.apps{display:flex;gap:16px;justify-content:center;align-items:center;background:linear-gradient(160deg,#3B4A6B,#6B3A44);border-radius:10px;padding:12px}
.app{display:grid;justify-items:center;gap:6px;font:500 11px/1 'Inter',Arial,sans-serif;color:#fff}
.icon{width:64px;height:64px;border-radius:15px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.25)}
.icon img{width:54px;height:54px}
.inkbg{background:var(--ink)}.paperbg{background:var(--paper)}
.closing{background:var(--ink);color:var(--paper);border-radius:18px;padding:36px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
.closing h2{font:800 30px/1.1 'Inter',Arial,sans-serif;letter-spacing:-.02em;margin-bottom:16px}
.closing ol{padding-left:22px;display:grid;gap:10px}
.closing li{font:400 15px/1.45 Georgia,serif;color:#C9CED6}.closing li b{font-family:'Inter',Arial,sans-serif;color:#fff;margin-right:6px}
.type h3{font:700 11px/1 'Inter',Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#8C95A2;margin:0 0 10px}
.type .hl{font:800 34px/1.05 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:-.025em}
.type .body{font:400 17px/1.5 Georgia,'Times New Roman',serif;color:#C9CED6;margin:10px 0 14px}
.type .mono{font:500 12px/1.4 'IBM Plex Mono',Menlo,monospace;color:#9CC0FF;letter-spacing:.06em}
.type .rule{height:4px;width:56px;background:linear-gradient(90deg,var(--blue) 50%%,var(--red) 50%%);margin-bottom:16px}
.foot{font:12px/1.5 'Inter',Arial,sans-serif;color:#5B6573;margin-top:22px}
</style></head>
<body>
<div class="masthead"><div class="wrap">
  <div>
    <div class="kicker">Brand exploration &middot; v1</div>
    <h1>RockLeak<em>.</em> Five marks.</h1>
    <p class="lede">An AI-powered American political news brand: Politico's authority, a leak-site's nerve, and facts as hard as bedrock. Red and blue are always used in equal measure, so the brand reads as nonpartisan.</p>
  </div>
  <div class="meta">
    <div><h3>Recommended tagline</h3><div class="tagline">%s<small>Campaign / editorial line: &ldquo;Truth, cracked open.&rdquo;</small></div></div>
    <div><h3>Palette</h3><div class="swatches">%s</div></div>
  </div>
</div></div>
<div class="wrap">
%s
<div class="closing">
  <div><h2>Ranking</h2><ol>%s</ol></div>
  <div class="type">
    <h3>Typography direction</h3>
    <div class="rule"></div>
    <div class="hl">Senate panel subpoenas the files it said didn't exist</div>
    <p class="body">Headlines in a heavy, tight grotesque (Inter Tight Black / Archivo ExtraBold); body in a sturdy text serif (Source Serif 4); data, document IDs and &ldquo;leak&rdquo; labels in a mono (IBM Plex Mono).</p>
    <div class="mono">DOC-2026-0419 &middot; SOURCE VERIFIED &middot; 3 SIDES CONTACTED</div>
    <div style="margin-top:22px">%s</div>
  </div>
</div>
<p class="foot">All marks are hand-built vector SVG (wordmark drawn as outlines, no font dependency). Files: brand/logos/. Generated by brand/tools/build_brand.py.</p>
</div>
</body></html>
""" % (b64(top["mark"]), INK, PAPER, RED, BLUE, GRAPHITE, SLATE, TAGLINE, swatches, "\n".join(sections), ranking,
       img(top["lock_dark"], 480, 120))


def main():
    os.makedirs(LOGOS, exist_ok=True)
    assets = {}
    for c in CONCEPTS:
        base = "concept-%d-%s" % (c["n"], c["slug"])
        title = "RockLeak - %s" % c["name"]
        d, b = build_mark(c, False)
        mark = svg_doc(512, 512, d, b, title + " mark")
        d, b = build_mark(c, True)
        mark_dark = svg_doc(512, 512, d, b, title + " mark (dark)")
        d, b = build_lockup(c, False)
        lock = svg_doc(1200, 300, d, b, title + " lockup")
        d, b = build_lockup(c, True)
        lock_dark = svg_doc(1200, 300, d, b, title + " lockup (dark)")
        write(os.path.join(LOGOS, base + "-mark.svg"), mark)
        write(os.path.join(LOGOS, base + "-mark-dark.svg"), mark_dark)
        write(os.path.join(LOGOS, base + "-lockup.svg"), lock)
        write(os.path.join(LOGOS, base + "-lockup-dark.svg"), lock_dark)
        assets[c["n"]] = dict(mark=mark, mark_dark=mark_dark, lock=lock, lock_dark=lock_dark)
    write(os.path.join(BRAND, "board.html"), build_board(CONCEPTS, assets, b64))
    print("ok")


if __name__ == "__main__":
    main()
