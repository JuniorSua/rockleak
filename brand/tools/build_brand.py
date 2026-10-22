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


# =====================================================================
# ROUND 2: Capitol direction, oil instead of blood (concepts 6-8)
# =====================================================================
OIL_HI = ["#3A414C", "#15181D", "#050608"]
REF_HI = ["#23272F", "#101318", "#050608"]               # glossy black body (light bg)
OIL_DARK = ["#3653D9", "#1597A3", "#6A43D6"]             # iridescent body (dark bg)
SHEEN = ["#4C6BFF", "#19BFB2", "#9563F5"]                # oil-slick accent: blue -> teal -> violet


def smooth_closed(pts):
    """Closed Catmull-Rom spline through pts, as cubic Beziers."""
    n = len(pts)
    d = "M%s,%s" % (f(pts[0][0]), f(pts[0][1]))
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += " C%s,%s %s,%s %s,%s" % (f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(p2[0]), f(p2[1]))
    return d + " Z"


def stream(spine, cap_top=True):
    """Viscous ribbon: spine = [(x, y, width)], top to bottom. Returns a smooth closed outline."""
    left = [(x - w / 2, y) for x, y, w in spine]
    right = [(x + w / 2, y) for x, y, w in spine][::-1]
    bx, by, bw = spine[-1]
    tx, ty, tw = spine[0]
    pts = left + [(bx, by + bw * 0.5)] + right
    if cap_top:
        pts.append((tx, ty - tw * 0.45))
    return smooth_closed(pts)


def oil_defs(uid, dark):
    body = OIL_DARK if dark else OIL_HI
    return ('<linearGradient id="%s-oil" x1="0" y1="0" x2="0.25" y2="1">'
            '<stop offset="0" stop-color="%s"/><stop offset="0.45" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
            '</linearGradient>'
            '<linearGradient id="%s-sheen" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="%s"/><stop offset="0.5" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
            '</linearGradient>') % (uid, body[0], body[1], body[2], uid, SHEEN[0], SHEEN[1], SHEEN[2])


def glint(cx, cy, rx, ry, rot=-30, op=0.9):
    return '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" transform="rotate(%s %s %s)" fill="#FFFFFF" opacity="%s"/>' % (
        f(cx), f(cy), f(rx), f(ry), f(rot), f(cx), f(cy), op)


def dome_rel(simple=False, finial=True, slots=True):
    """Capitol in relative units: centre x=0, ground y=0, height ~302. Returns one evenodd path."""
    def rect(x, y, w, h):
        return "M%s,%s H%s V%s H%s Z" % (f(x), f(y), f(x + w), f(y + h), f(x))
    d = [rect(-150, -16, 300, 16), rect(-134, -32, 268, 16)]
    drum = rect(-116, -88, 232, 56)
    if slots:
        n, sw = (3, 22) if simple else (7, 10)
        col = (232 - n * sw) / (n + 1)
        for k in range(n):
            sx = -116 + col * (k + 1) + sw * k
            drum += " M%s,%s V-42 H%s V%s Z" % (f(sx), -76 if simple else -78, f(sx + sw), -76 if simple else -78)   # CCW hole
    d.append(drum)
    d.append(rect(-126, -100, 252, 12))
    d.append(rect(-106, -116, 212, 16))
    d.append("M-96,-116 A96,110 0 0 1 96,-116 Z")
    d.append(rect(-16, -250, 32, 30))
    d.append(rect(-21, -257, 42, 8))
    d.append("M-16,-256 A16,17 0 0 1 16,-256 Z")
    if finial:
        d.append(poly([(-4.5, -270), (4.5, -270), (0, -302)]))
    return " ".join(d)


DOME_RIBS = ("M-68,-116 A68,110 0 0 1 0,-226 M68,-116 A68,110 0 0 0 0,-226")


# ---------------------------------------------------------------- concept 6
def oil_cap(cx, cy, rx, ry, drips, phi=(132, 48)):
    """Oil coating the crown of a dome (ellipse centre cx,cy) with drip fingers.
    drips: list of (x, length_below_rim, width), right-to-left order."""
    pts = []
    for k in range(9):
        a = math.radians(phi[0] + (phi[1] - phi[0]) * k / 8)
        pts.append((cx + rx * math.cos(a), cy - ry * math.sin(a)))
    ex = lambda x: cy - ry * math.sqrt(max(0.0, 1 - ((x - cx) / rx) ** 2)) * 0.0 + 0  # unused helper
    rim = lambda x: 0.35 * abs(x - cx) ** 1.0 * 0 + (cy - ry * 0.55)            # flat-ish lower rim
    right_x = pts[-1][0]
    pts.append((right_x - 4, pts[-1][1] + 14))
    for x, ln, w in drips:
        y0 = rim(x) + 4
        pts += [(x + w / 2 + 2, y0), (x + w / 2, y0 + ln * 0.45), (x + w * 0.62, y0 + ln * 0.85),
                (x, y0 + ln + w * 0.55), (x - w * 0.62, y0 + ln * 0.85), (x - w / 2, y0 + ln * 0.45), (x - w / 2 - 2, y0)]
    pts.append((pts[0][0] + 4, pts[0][1] + 14))
    return smooth_closed(pts)


def mark_blueprint(dark=False, uid="c6", simple=False):
    """Architectural line drawing of the dome. Its crown is full of oil that drips down the inside
    of the shell; the longest drip breaks into pixels inside the colonnade."""
    ink = PAPER if dark else INK
    S, s2 = (30, 24) if simple else (16, 10)
    oy = 12
    L, top = [], []
    def line(x1, y1, x2, y2, w, dst=None):
        (L if dst is None else dst).append('<path d="M%s,%s L%s,%s" stroke-width="%s"/>' % (f(x1), f(y1 + oy), f(x2), f(y2 + oy), w))
    def arc(d, w):
        L.append('<path d="%s" stroke-width="%s" transform="translate(0 %s)"/>' % (d, w, oy))
    if simple:
        line(104, 384, 408, 384, S)
        for x in (164, 207, 305, 348):
            line(x, 302, x, 370, s2)
        line(132, 290, 380, 290, S)
        arc("M158,276 A98,116 0 0 1 354,276", S)
        line(256, 112, 256, 150, s2, top)
        cx, cy, rx, ry = 256, 276, 98, 116
        rim, drips = 216, [(256, 52, 30)]
        pixels = []
    else:
        line(96, 392, 416, 392, S)
        line(122, 366, 390, 366, S)
        for x in (152, 186.7, 221.3, 290.7, 325.3, 360):
            line(x, 308, x, 358, s2)
        line(134, 298, 378, 298, S)
        line(150, 272, 362, 272, S)
        arc("M160,272 A96,110 0 0 1 352,272", S)
        arc("M188,272 A68,108 0 0 1 256,164 M324,272 A68,108 0 0 0 256,164", s2)
        line(241, 134, 241, 158, s2, top)
        line(271, 134, 271, 158, s2, top)
        line(230, 160, 282, 160, s2, top)
        top.append('<path d="M230,%s A26,24 0 0 1 282,%s Z" stroke="none" fill="%s"/>' % (f(134 + oy), f(134 + oy), ink))
        line(256, 90, 256, 112, s2, top)
        cx, cy, rx, ry = 256, 272, 96, 110
        rim, drips = 206, [(300, 22, 12), (256, 50, 15), (214, 12, 11)]
        pixels = [(256, 316, 13), (256, 336, 9), (256, 351, 6)]
    # oil body: everything above the rim line, plus drip fingers; clipped to the inside of the shell
    pts = [(cx - rx - 20, rim), (cx - rx - 20, cy - ry - 30), (cx + rx + 20, cy - ry - 30), (cx + rx + 20, rim)]
    for x, ln, w in sorted(drips, key=lambda d: -d[0]):
        pts += [(x + w / 2 + 3, rim), (x + w / 2, rim + ln * 0.5), (x + w * 0.6, rim + ln * 0.88),
                (x, rim + ln + w * 0.55), (x - w * 0.6, rim + ln * 0.88), (x - w / 2, rim + ln * 0.5), (x - w / 2 - 3, rim)]
    pts = [(x, y + oy) for x, y in pts]
    # straight top part + smooth drips: build path manually
    d = "M%s,%s L%s,%s L%s,%s L%s,%s" % (f(pts[0][0]), f(pts[0][1]), f(pts[1][0]), f(pts[1][1]),
                                         f(pts[2][0]), f(pts[2][1]), f(pts[3][0]), f(pts[3][1]))
    for i in range(len(drips)):
        seg = pts[4 + 7 * i: 4 + 7 * (i + 1)]
        d += " L%s,%s" % (f(seg[0][0]), f(seg[0][1]))
        # use an open Catmull-Rom through the finger (skip closing segment)
        for j in range(len(seg) - 1):
            p0 = seg[max(j - 1, 0)]; p1 = seg[j]; p2 = seg[j + 1]; p3 = seg[min(j + 2, len(seg) - 1)]
            c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
            c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
            d += " C%s,%s %s,%s %s,%s" % (f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(p2[0]), f(p2[1]))
    d += " Z"
    shell = "M%s,%s A%s,%s 0 0 1 %s,%s Z" % (f(cx - rx), f(cy + oy), rx, ry, f(cx + rx), f(cy + oy))
    defs = oil_defs(uid, dark)
    defs += '<clipPath id="%s-shell"><path d="%s"/></clipPath>' % (uid, shell)
    body = ['<g clip-path="url(#%s-shell)"><path d="%s" fill="url(#%s-oil)"/></g>' % (uid, d, uid)]
    body.append('<g fill="none" stroke="%s">' % ink + "".join(L) + '</g>')
    body.append('<g fill="none" stroke="%s">' % ink + "".join(top) + '</g>')
    for i, (x, y, w) in enumerate(pixels):
        fill = "url(#%s-sheen)" % uid if i == len(pixels) - 1 else "url(#%s-oil)" % uid
        body.append('<rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>' % (f(x - w / 2), f(y + oy), w, w, fill))
    if not simple:
        body.append('<path d="M204,%s C220,%s 238,%s 252,%s" stroke="url(#%s-sheen)" stroke-width="3.5" stroke-linecap="round" fill="none"/>' % (
            f(196 + oy), f(186 + oy), f(181 + oy), f(180 + oy), uid))
        body.append(glint(252, 262 + oy, 2.2, 4.4, 0, 0.85))
    else:
        body.append(glint(248, 258 + oy, 4, 7, 0, 0.85))
    return defs, "\n".join(body)


# ---------------------------------------------------------------- concept 7
def mark_reflection(dark=False, uid="c7", simple=False):
    """Solid dome above a slick of oil; its reflection breaks into lines of data and drips."""
    ink = PAPER if dark else INK
    k = 0.74
    horizon = 286
    gap = 12
    ry = 0.6
    defs = oil_defs(uid, dark)
    # reflection gradient in the reflection's own (relative) coordinates: near = sheen-dark, far = black
    body_cols = OIL_DARK if dark else REF_HI
    defs += ('<linearGradient id="%s-ref" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-280">'
             '<stop offset="0" stop-color="%s"/><stop offset="0.5" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
             '</linearGradient>') % (uid, body_cols[0], body_cols[1], body_cols[2])
    lines = [] if simple else [(22, 4), (40, 5), (62, 6.5), (88, 8)]
    if simple:
        lines = [(30, 7), (62, 9)]
    bars = "".join('<rect x="0" y="%s" width="512" height="%s" fill="#000"/>' % (f(horizon + gap + y), f(h)) for y, h in lines)
    defs += ('<mask id="%s-scan" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">'
             '<rect width="512" height="512" fill="#fff"/>%s</mask>') % (uid, bars)
    rib_mask = ""
    if not simple:
        defs += ('<mask id="%s-ribs" maskUnits="userSpaceOnUse" x="-300" y="-400" width="600" height="500">'
                 '<rect x="-300" y="-400" width="600" height="500" fill="#fff"/>'
                 '<path d="%s" fill="none" stroke="#000" stroke-width="7"/></mask>') % (uid, DOME_RIBS)
        rib_mask = ' mask="url(#%s-ribs)"' % uid
    body = []
    body.append('<g transform="translate(256 %s) scale(%s)"><path d="%s" fill="%s" fill-rule="evenodd"%s/></g>' % (
        f(horizon), k, dome_rel(simple), ink, rib_mask))
    # oil surface line (the only accent): a thin sheen rule wider than the building
    body.append('<rect x="92" y="%s" width="328" height="%s" rx="%s" fill="url(#%s-sheen)"/>' % (
        f(horizon + 3), "4" if not simple else "6", "2" if not simple else "3", uid))
    body.append('<g mask="url(#%s-scan)"><g transform="translate(256 %s) scale(%s %s)">'
                '<path d="%s" fill="url(#%s-ref)" fill-rule="evenodd"/></g>' % (
                    uid, f(horizon + gap), k, f(-k * ry), dome_rel(simple, finial=False, slots=False), uid))
    body.append('</g>')
    # one drop hangs from the reflected lantern: the information leaving the building
    tip = horizon + gap + 268 * k * ry
    dr = 17 if simple else 11
    body.append('<path d="%s" fill="url(#%s-oil)"/>' % (drop(256, tip - 3, dr), uid))
    body.append(glint(256 - dr * 0.42, tip - 3 + 2.1 * dr - dr * 0.35, dr * 0.17, dr * 0.36, 20, 0.85))
    return defs, "\n".join(body)


# ---------------------------------------------------------------- concept 8
def mark_spill(dark=False, uid="c8", simple=False):
    """Solid dome with one clean fracture; oil wells out, runs down its flank and pools as a slick."""
    ink = PAPER if dark else INK
    base = 372
    defs = oil_defs(uid, dark)
    spine = [(259, 210, 9), (265, 234, 15), (277, 260, 17), (287, 288, 19), (292, 316, 16), (299, 342, 21), (311, 370, 30)]
    if simple:
        spine = [(260, 196, 28), (270, 236, 34), (286, 272, 30), (294, 310, 34), (304, 348, 32), (316, 376, 40)]
    st = stream(spine)
    pool_pts = [(214, 396), (262, 384), (330, 381), (402, 384), (452, 393), (464, 403), (430, 413),
                (360, 418), (290, 417), (236, 410)]
    if simple:
        pool_pts = [(196, 398), (262, 382), (340, 380), (420, 384), (470, 396), (472, 410), (420, 422), (330, 425), (250, 420), (200, 410)]
    pool = smooth_closed(pool_pts)
    crack = [(266, 146), (251, 178), (262, 196), (259, 214)]
    crack_poly = poly([(264 - 5, 146), (253 - 3, 184), (259 - 1, 214),
                       (259 + 1, 214), (253 + 3, 184), (264 + 5, 146)])
    ko = 18 if simple else 12
    defs += ('<mask id="%s-ko" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">'
             '<rect width="512" height="512" fill="#fff"/>'
             '<path d="%s" fill="#000" stroke="#000" stroke-width="%s" stroke-linejoin="round"/>'
             '<path d="%s" fill="#000" stroke="#000" stroke-width="%s"/>'
             '<path d="%s" fill="#000"/></mask>') % (uid, st, ko, pool, ko, crack_poly if not simple else
                                                    poly([(270, 120), (250, 178), (266, 214), (254, 214), (240, 178), (258, 120)]))
    rib = ""
    if not simple:
        defs += ('<mask id="%s-ribs" maskUnits="userSpaceOnUse" x="-300" y="-400" width="600" height="500">'
                 '<rect x="-300" y="-400" width="600" height="500" fill="#fff"/>'
                 '<path d="%s" fill="none" stroke="#000" stroke-width="7"/></mask>') % (uid, DOME_RIBS)
        rib = ' mask="url(#%s-ribs)"' % uid
    body = ['<g mask="url(#%s-ko)"><g transform="translate(256 %d)"><path d="%s" fill="%s" fill-rule="evenodd"%s/></g></g>' % (
        uid, base, dome_rel(simple), ink, rib)]
    body.append('<path d="%s" fill="url(#%s-oil)"/>' % (pool, uid))
    body.append('<path d="%s" fill="url(#%s-oil)"/>' % (st, uid))
    if not simple:
        body.append('<path d="M261,232 C268,248 276,262 282,280" stroke="url(#%s-sheen)" stroke-width="3" stroke-linecap="round" fill="none"/>' % uid)
        body.append('<path d="M262,392 C310,386 370,386 420,392" stroke="url(#%s-sheen)" stroke-width="3.5" stroke-linecap="round" fill="none"/>' % uid)
        body.append(glint(402, 397, 9, 2.6, -4, 0.8))
    else:
        body.append('<path d="M250,394 C320,386 390,387 440,395" stroke="url(#%s-sheen)" stroke-width="6" stroke-linecap="round" fill="none"/>' % uid)
    return defs, "\n".join(body)


# ---------------------------------------------------------------- wordmark v2
# Architectural geometric grotesque: cap 100, stems 13, horizontals 12, open tracking.
def g2_R():
    outer = "M0,0 H40 C56.5,0 66,10.5 66,28 C66,42 58,51.5 45.5,54.5 L66,100 H51 L31.5,56 H13 V100 H0 Z"
    counter = "M13,12 V44 H40 C49.5,44 53,37.5 53,28 C53,18.5 49.5,12 40,12 Z"
    return outer + " " + counter, 66


def g2_O():
    return ellipse(50, 50, 50, 51, True) + " " + ellipse(50, 50, 37, 39, False), 100


def g2_C():
    cx, cy, rx, ry, irx, iry = 50, 50, 50, 51, 37, 39
    a = math.radians(42)
    o1 = (cx + rx * math.cos(a), cy - ry * math.sin(a))
    o2 = (cx + rx * math.cos(a), cy + ry * math.sin(a))
    i1 = (cx + irx * math.cos(a), cy - iry * math.sin(a))
    i2 = (cx + irx * math.cos(a), cy + iry * math.sin(a))
    d = "M%s,%s A%s,%s 0 1 0 %s,%s L%s,%s A%s,%s 0 1 1 %s,%s Z" % (
        f(o1[0]), f(o1[1]), rx, ry, f(o2[0]), f(o2[1]), f(i2[0]), f(i2[1]), irx, iry, f(i1[0]), f(i1[1]))
    return d, o1[0]


def g2_K():
    tl, armd = (46, 0), (-33, 52)
    w = 13 / math.cos(math.atan(33 / 52))
    tr = (46 + w, 0)
    crotch = (tr[0] + armd[0] * 40 / 52, 40)
    br, bl = (68, 100), (52, 100)
    legd = (br[0] - crotch[0], br[1] - crotch[1])
    p = intersect(bl, (-legd[0], -legd[1]), tr, armd)
    q = intersect(tr, armd, (13, 0), (0, 1))
    return poly([(0, 0), (13, 0), (13, 52), tl, tr, crotch, br, bl, p, q, (13, 100), (0, 100)]), 68


def g2_L():
    return "M0,0 H13 V88 H52 V100 H0 Z", 52


def g2_E():
    return "M0,0 H54 V12 H13 V44 H50 V56 H13 V88 H56 V100 H0 Z", 56


def g2_A():
    s = 0.33
    inner_apex = 100 - (40 - 14.5) / s
    return poly([(33, 0), (47, 0), (80, 100), (65.5, 100), (40, inner_apex), (14.5, 100), (0, 100)]), 80


G2 = {"R": g2_R, "O": g2_O, "C": g2_C, "K": g2_K, "L": g2_L, "E": g2_E, "A": g2_A}
GAPS2 = [17, 17, 22, 24, 20, 13, 17, 0]


def wordmark2():
    """Returns (letters_d, drop_d, width). The A is a pediment; an oil drop replaces its crossbar."""
    x, parts, dropd = 0, [], ""
    for i, ch in enumerate("ROCKLEAK"):
        d, adv = G2[ch]()
        parts.append(place(d, x))
        if ch == "A":
            dropd = drop(x + 40, 50, 8.4)
        x += adv + GAPS2[i]
    return " ".join(parts), dropd, x


CONCEPTS2 = [
    dict(n=6, slug="blueprint", name="Blueprint Leak", fn=mark_blueprint, mark_size=272,
         line="The dome as a precise architectural line drawing; its crown is full of glossy oil that drips down the shell, and the longest drip breaks into pixels inside the colonnade."),
    dict(n=7, slug="reflection", name="Reflection", fn=mark_reflection, mark_size=272,
         line="A solid dome standing on a slick of oil; its reflection breaks into scan-lines of data, and one drop falls from the reflected lantern."),
    dict(n=8, slug="spill", name="The Spill", fn=mark_spill, mark_size=272,
         line="A solid dome with one clean fracture; oil wells out, runs down its flank and pools into a slick at its base."),
]
SIGNALS2 = {6: ["Architecture", "Data leak", "Precision"], 7: ["World / reflection", "Data leak", "Calm"],
            8: ["Politics", "Spill", "Story"]}
RANK2 = {6: 3, 7: 1, 8: 2}


def build_mark2(c, dark=False, simple=False):
    return c["fn"](dark=dark, uid="c%d%s%s" % (c["n"], "d" if dark else "", "s" if simple else ""), simple=simple)


def build_lockup2(c, dark=False):
    defs, mbody = build_mark2(c, dark)
    ink = PAPER if dark else INK
    W, H = 1200, 300
    cap = 60
    s = cap / 100.0
    letters, dropd, wm_w = wordmark2()
    ms = c["mark_size"]
    gap = 34
    total = ms + gap + wm_w * s
    x0 = (W - total) / 2
    my = (H - ms) / 2
    wx, wy = x0 + ms + gap, (H - cap) / 2
    uid = "w%d%s" % (c["n"], "d" if dark else "")
    defs += ('<linearGradient id="%s-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%s"/>'
             '<stop offset="0.5" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>') % (uid, SHEEN[0], SHEEN[1], SHEEN[2])
    parts = []
    if dark:
        parts.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, INK))
    parts.append('<g transform="translate(%s %s) scale(%s)">\n%s\n</g>' % (f(x0), f(my), f(ms / 512.0), mbody))
    parts.append('<g transform="translate(%s %s) scale(%s)">\n<path d="%s" fill="%s"/>\n<path d="%s" fill="url(#%s-sheen)"/>\n</g>' % (
        f(wx), f(wy), f(s), letters, ink, dropd, uid))
    return defs, "\n".join(parts)


def build_board2(concepts, assets, ref, b64):
    def img(svg, w, h=None):
        return '<img src="%s" width="%s" height="%s" alt="">' % (b64(svg), w, h or w)

    secs = []
    for c in concepts:
        a = assets[c["n"]]
        chips = "".join('<span class="chip">%s</span>' % t for t in SIGNALS2[c["n"]])
        secs.append("""
<section class="concept">
  <header class="c-head"><div class="c-num">%02d</div>
    <div class="c-title"><h2>%s</h2><p>%s</p></div>
    <div class="c-chips">%s<span class="chip rank">Rank #%d</span></div></header>
  <div class="c-grid">
    <div class="hero tile white">%s<span class="cap">Mark &middot; 512px</span></div>
    <div class="right">
      <div class="sizes">
        <div class="tile white size"><div class="row">%s%s%s<span class="sep"></span>%s%s</div><span class="cap">64 &middot; 32 &middot; 16 &nbsp;|&nbsp; favicon cut 32 &middot; 16</span></div>
        <div class="tile ink size"><div class="row">%s%s%s<span class="sep"></span>%s%s</div><span class="cap">on dark</span></div>
      </div>
      <div class="tile white lock">%s<span class="cap">Primary lockup &middot; light</span></div>
      <div class="tile lockdark">%s<span class="cap">Lockup &middot; dark</span></div>
      <div class="usage">
        <div class="browser light"><div class="tabs"><div class="tab">%s<span>RockLeak &middot; Bedrock facts. Every side.</span><i>&times;</i></div></div>
          <div class="bar"><span class="lock-ico"></span>rockleak.com</div></div>
        <div class="browser dark"><div class="tabs"><div class="tab">%s<span>RockLeak &middot; Investigations</span><i>&times;</i></div></div>
          <div class="bar"><span class="lock-ico"></span>rockleak.com/investigations</div></div>
        <div class="apps"><div class="app"><div class="icon inkbg">%s</div><span>RockLeak</span></div>
          <div class="app"><div class="icon whitebg">%s</div><span>RockLeak</span></div></div>
      </div>
    </div>
  </div>
</section>""" % (c["n"], c["name"], c["line"], chips, RANK2[c["n"]], img(a["mark"], 440),
                 img(a["mark"], 64), img(a["mark"], 32), img(a["mark"], 16), img(a["fav"], 32), img(a["fav"], 16),
                 img(a["mark_dark"], 64), img(a["mark_dark"], 32), img(a["mark_dark"], 16), img(a["fav_dark"], 32), img(a["fav_dark"], 16),
                 img(a["lock"], 640, 160), img(a["lock_dark"], 640, 160),
                 img(a["fav"], 16), img(a["fav_dark"], 16), img(a["fav_dark"], 56), img(a["fav"], 56)))
    sw = "".join('<div class="sw"><div class="chipc" style="background:%s"></div><b>%s</b><code>%s</code></div>' % (hx, nm, hx)
                 for nm, hx in [("Ink", INK), ("Graphite", GRAPHITE), ("Slate", SLATE), ("Paper", "#FFFFFF"),
                                ("Sheen blue", SHEEN[0]), ("Sheen teal", SHEEN[1]), ("Sheen violet", SHEEN[2])])
    ranked = sorted(concepts, key=lambda c: RANK2[c["n"]])
    ranking = "".join('<li><b>%s</b> <span>%s</span></li>' % (c["name"], c["line"]) for c in ranked)
    top = assets[ranked[0]["n"]]
    return """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>RockLeak - Logo Round 2</title><link rel="icon" href="%s">
<style>
:root{--ink:%s}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#F2F1EE;color:var(--ink);font-family:'Inter','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1360px;margin:0 auto;padding:0 40px 72px}
.mast{background:#fff;border-bottom:1px solid #E4E2DD;padding:52px 0 44px;margin-bottom:36px}
.mast .wrap{padding-bottom:0;display:grid;grid-template-columns:1.25fr 1fr;gap:56px;align-items:end}
.kicker{font:600 11px/1 'Inter',Arial,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#5B6573;display:flex;gap:12px;align-items:center}
.kicker:before{content:"";width:28px;height:3px;border-radius:2px;background:linear-gradient(90deg,%s,%s,%s)}
h1{font:700 56px/1.02 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:-.035em;margin:18px 0 14px}
.lede{font:400 18px/1.55 Georgia,'Times New Roman',serif;color:#3A424D;max-width:640px}
.meta{display:grid;gap:18px}
.meta h3{font:600 10.5px/1 'Inter',Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#8C95A2;margin-bottom:10px}
.ref{display:flex;gap:16px;align-items:center;font:400 13px/1.45 Georgia,serif;color:#5B6573}
.ref img{background:#F4F2ED;border-radius:10px;padding:6px;flex:none}
.swatches{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.sw{font-size:10px;color:#5B6573}.sw b{display:block;color:var(--ink);font-size:10.5px;margin-top:6px;font-weight:600}
.sw code{font:9.5px/1.4 'IBM Plex Mono',Menlo,monospace}
.chipc{height:30px;border-radius:6px;border:1px solid #E4E2DD}
.concept{background:#fff;border:1px solid #E4E2DD;border-radius:16px;padding:28px;margin-bottom:24px}
.c-head{display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center;padding-bottom:20px;border-bottom:1px solid #EEECE8;margin-bottom:22px}
.c-num{font:300 40px/1 'Inter',Arial,sans-serif;letter-spacing:-.03em;color:#8C95A2;width:60px}
.c-title h2{font:700 26px/1.1 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:-.02em}
.c-title p{font:400 15.5px/1.45 Georgia,serif;color:#3A424D;margin-top:5px;max-width:740px}
.c-chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.chip{font:600 9.5px/1 'Inter',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:7px 10px;border-radius:99px;border:1px solid #E4E2DD;color:#3A424D}
.chip.rank{background:var(--ink);color:#fff;border-color:var(--ink)}
.c-grid{display:grid;grid-template-columns:480px 1fr;gap:16px}
.tile{border-radius:12px;position:relative;display:flex;align-items:center;justify-content:center}
.tile .cap{position:absolute;left:14px;bottom:10px;font:600 9px/1 'Inter',Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8C95A2}
.white{background:#fff;border:1px solid #EEECE8}.ink{background:var(--ink)}
.hero{min-height:560px;height:100%%}
.right{display:grid;gap:14px}
.sizes{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.size{height:112px}.size .row{display:flex;gap:22px;align-items:flex-end;padding-bottom:10px}
.sep{width:1px;height:40px;background:#D6D3CB;align-self:center}.ink .sep{background:#2A3039}
.lock,.lockdark{height:176px}.lockdark{background:var(--ink)}
.lock img,.lockdark img{width:640px;height:160px}
.usage{display:grid;grid-template-columns:1fr 1fr 170px;gap:14px}
.browser{border-radius:10px;overflow:hidden;border:1px solid #E4E2DD}
.browser .tabs{display:flex;align-items:flex-end;padding:8px 8px 0;background:#E8EAED;height:40px}
.browser .tab{display:flex;align-items:center;gap:8px;background:#fff;border-radius:8px 8px 0 0;padding:0 10px;height:32px;width:270px;font:500 12px/1 'Inter',Arial,sans-serif;color:#1D2128;white-space:nowrap;overflow:hidden}
.browser .tab span{overflow:hidden;text-overflow:ellipsis;flex:1}.browser .tab i{font-style:normal;color:#5B6573;font-size:14px}
.browser .bar{background:#fff;padding:10px 12px 26px;font:12px/1 'Inter',Arial,sans-serif;color:#3A424D;display:flex;gap:8px;align-items:center}
.lock-ico{width:9px;height:10px;border:2px solid #5B6573;border-radius:2px}
.browser.dark{border-color:#2A3039}.browser.dark .tabs{background:#1C2027}.browser.dark .tab{background:#2A3039;color:#E3E6EA}
.browser.dark .bar{background:#2A3039;color:#C9CED6}.browser.dark .lock-ico{border-color:#AEB5BF}
.apps{display:flex;gap:14px;justify-content:center;align-items:center;background:linear-gradient(160deg,#C9D3E0,#E9E4DA);border-radius:10px;padding:12px}
.app{display:grid;justify-items:center;gap:6px;font:500 10.5px/1 'Inter',Arial,sans-serif;color:#1D2128}
.icon{width:62px;height:62px;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.18)}
.inkbg{background:var(--ink)}.whitebg{background:#fff}
.closing{background:#fff;border:1px solid #E4E2DD;border-radius:16px;padding:36px;display:grid;grid-template-columns:1fr 1fr;gap:44px}
.closing h2{font:700 26px/1.1 'Inter',Arial,sans-serif;letter-spacing:-.02em;margin-bottom:16px}
.closing ol{padding-left:22px;display:grid;gap:10px}
.closing li{font:400 15px/1.45 Georgia,serif;color:#3A424D}.closing li b{font-family:'Inter',Arial,sans-serif;color:var(--ink);margin-right:6px}
.type h3{font:600 10.5px/1 'Inter',Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#8C95A2;margin-bottom:14px}
.type .hl{font:700 32px/1.08 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:-.025em}
.type .body{font:400 16.5px/1.55 Georgia,serif;color:#3A424D;margin:12px 0}
.type .mono{font:500 11.5px/1.4 'IBM Plex Mono',Menlo,monospace;color:#5B6573;letter-spacing:.06em}
.foot{font:12px/1.5 'Inter',Arial,sans-serif;color:#8C95A2;margin-top:20px}
</style></head><body>
<div class="mast"><div class="wrap">
  <div><div class="kicker">Logo exploration &middot; Round 2 &middot; Capitol direction</div>
    <h1>The leak is oil, not blood.</h1>
    <p class="lede">Three refinements of concept 4. The dome stays, the red drop goes. Information now leaks as glossy black oil with a restrained oil-slick sheen, the brand's only accent. The new wordmark is an architectural geometric grotesque with open tracking; its A is a pediment, with a drop where the crossbar would be.</p></div>
  <div class="meta">
    <div><h3>Reference &middot; Round 1, concept 4</h3><div class="ref">%s<span>Chosen direction. Kept: the dome, the crack, the single drop. Dropped: red, the stars, the heavy wordmark.</span></div></div>
    <div><h3>Palette</h3><div class="swatches">%s</div></div>
  </div>
</div></div>
<div class="wrap">
%s
<div class="closing">
  <div><h2>Ranking</h2><ol>%s</ol></div>
  <div class="type"><h3>Wordmark &amp; type in use</h3>
    <div style="margin:4px 0 22px">%s</div>
    <div class="hl">Senate panel subpoenas the files it said didn&rsquo;t exist</div>
    <p class="body">Black type, white space, one accent. Headlines in Inter Tight (Semibold to Bold); body in Source Serif 4; document IDs in IBM Plex Mono.</p>
    <div class="mono">DOC-2026-0419 &middot; SOURCE VERIFIED &middot; 3 SIDES CONTACTED</div></div>
</div>
<p class="foot">Hand-built vector SVG, wordmark drawn as outlines. Files: brand/logos/concept-6..8-*. Generated by brand/tools/build_brand.py.</p>
</div></body></html>
""" % (b64(top["fav"]), INK, SHEEN[0], SHEEN[1], SHEEN[2], img(ref, 88, 88), sw, "\n".join(secs), ranking,
       img(top["lock"], 520, 130))


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
    # Round 1 board is superseded; board.html now presents round 2 only.
    assets2 = {}
    for c in CONCEPTS2:
        base = "concept-%d-%s" % (c["n"], c["slug"])
        title = "RockLeak - %s" % c["name"]
        out = {}
        for key, dark, simple, fn, size in (("mark", False, False, "mark", 512), ("mark_dark", True, False, "mark-dark", 512),
                                            ("fav", False, True, "favicon", 512), ("fav_dark", True, True, "favicon-dark", 512)):
            d, b = build_mark2(c, dark, simple)
            out[key] = svg_doc(512, 512, d, b, "%s %s" % (title, fn))
            write(os.path.join(LOGOS, "%s-%s.svg" % (base, fn)), out[key])
        for key, dark, fn in (("lock", False, "lockup"), ("lock_dark", True, "lockup-dark")):
            d, b = build_lockup2(c, dark)
            out[key] = svg_doc(1200, 300, d, b, "%s %s" % (title, fn))
            write(os.path.join(LOGOS, "%s-%s.svg" % (base, fn)), out[key])
        assets2[c["n"]] = out
    write(os.path.join(BRAND, "board.html"), build_board2(CONCEPTS2, assets2, assets[4]["mark"], b64))
    print("ok")


if __name__ == "__main__":
    main()
