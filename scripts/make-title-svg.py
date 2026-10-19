import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

font_path, text, out = sys.argv[1], sys.argv[2], sys.argv[3]
f = TTFont(font_path)
gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
hmtx = f['hmtx']
tracking = -0.04 * upm
pen = SVGPathPen(gs)
bounds = BoundsPen(gs)
x = 0
for ch in text:
    g = cmap[ord(ch)]
    # flip y: font units are y-up, SVG is y-down
    t = (1, 0, 0, -1, x, 0)
    gs[g].draw(TransformPen(pen, t))
    gs[g].draw(TransformPen(bounds, t))x
    x += hmtx[g][0] + tracking
xmin, ymin, xmax, ymax = bounds.bounds
pad = upm * 0.02
vb = (xmin - pad, ymin - pad, xmax - xmin + 2 * pad, ymax - ymin + 2 * pad)
d = pen.getCommands()
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}" '
       f'role="img" aria-label="{text}"><path fill="currentColor" d="{d}"/></svg>')
open(out, 'w').write(svg)
print(f'{out}: {len(svg)/1024:.1f} KB, viewBox {vb[2]:.0f}x{vb[3]:.0f}')
