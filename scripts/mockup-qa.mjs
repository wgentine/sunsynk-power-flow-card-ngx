/** Geometry QA for design/mockup — paths, text, and node circles. */
export async function auditMockupGeometry(page) {
  return page.evaluate(() => {
    const pad = window.__mockupQa?.pad ?? 2;
    const texts = window.__mockupQa?.textBoxes ?? [];
    const nodes = window.__mockupQa?.nodeCircles ?? [];
    const svg = document.getElementById('diagram');
    const paths = [...svg.querySelectorAll('#layer-flows path.flow-active')];
    const violations = [];

    const inRect = (x, y, b) =>
      x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;

    function clamp(v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    }

    function circleRectOverlap(cx, cy, r, rect) {
      const px = clamp(cx, rect.x, rect.x + rect.w);
      const py = clamp(cy, rect.y, rect.y + rect.h);
      const d = Math.hypot(cx - px, cy - py);
      return d < r + pad;
    }

    function samplePath(el, step = 6) {
      const pts = [];
      let len = 0;
      try {
        len = el.getTotalLength();
      } catch {
        return pts;
      }
      if (!Number.isFinite(len) || len <= 0) return pts;
      for (let d = 0; d <= len; d += step) {
        const p = el.getPointAtLength(d);
        pts.push({ x: p.x, y: p.y });
      }
      return pts;
    }

    function segIntersect(a, b, c, d) {
      const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
      if (Math.abs(den) < 1e-6) return false;
      const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den;
      const u = ((a.x - c.x) * (a.y - b.y) - (a.y - c.y) * (a.x - b.x)) / den;
      return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98;
    }

    const sampled = paths.map((el) => ({
      id: el.id,
      pts: samplePath(el),
    }));

    for (const { id, pts } of sampled) {
      for (const p of pts) {
        for (const tb of texts) {
          if (inRect(p.x, p.y, tb)) {
            violations.push({ kind: 'path-text', path: id, text: tb.id, at: p });
          }
        }
      }
    }

    for (let i = 0; i < sampled.length; i++) {
      for (let j = i + 1; j < sampled.length; j++) {
        const A = sampled[i];
        const B = sampled[j];
        if (A.id.startsWith('flow-L') && B.id === 'flow-bus') continue;
        if (B.id.startsWith('flow-L') && A.id === 'flow-bus') continue;
        if (
          (A.id === 'flow-pv1' && B.id === 'flow-pv2')
          || (A.id === 'flow-pv2' && B.id === 'flow-pv1')
        ) continue;
        if (
          (A.id === 'flow-grid-ct' && B.id === 'flow-grid-inv')
          || (B.id === 'flow-grid-ct' && A.id === 'flow-grid-inv')
        ) continue;
        for (let s = 0; s < A.pts.length - 1; s++) {
          for (let t = 0; t < B.pts.length - 1; t++) {
            if (segIntersect(A.pts[s], A.pts[s + 1], B.pts[t], B.pts[t + 1])) {
              violations.push({ kind: 'path-path', a: A.id, b: B.id });
              break;
            }
          }
        }
      }
    }

    for (const node of nodes) {
      for (const tb of texts) {
        if (circleRectOverlap(node.cx, node.cy, node.r, tb)) {
          violations.push({ kind: 'node-text', node: node.id, text: tb.id });
        }
      }
    }

    const physicalNodes = nodes.filter((n) => n.r > 0);
    for (let i = 0; i < physicalNodes.length; i++) {
      for (let j = i + 1; j < physicalNodes.length; j++) {
        const A = physicalNodes[i];
        const B = physicalNodes[j];
        const d = Math.hypot(A.cx - B.cx, A.cy - B.cy);
        const ra = A.rGlow ?? A.r;
        const rb = B.rGlow ?? B.r;
        if (d < ra + rb + pad) {
          violations.push({ kind: 'node-node', a: A.id, b: B.id, dist: d, min: ra + rb });
        }
      }
    }

    const ringTol = window.__mockupQa?.ringTol ?? 2;
    const flowEdges = window.__mockupQa?.flowEdges ?? [];
    const qaDir = window.__mockupQa?.dir ?? 'a';

  function distToRing(px, py, node) {
      if (!node) return Infinity;
      if (node.r === 0) return Math.hypot(px - node.cx, py - node.cy);
      const d = Math.hypot(px - node.cx, py - node.cy);
      return Math.abs(d - node.r);
    }

    const nodeById = (id) => nodes.find((n) => n.id === id);
    const busLine = window.__mockupQa?.busLine;

    function onBusLine(px, py) {
      if (!busLine) return false;
      return (
        Math.abs(py - busLine.y) <= ringTol
        && px >= busLine.x0 - ringTol
        && px <= busLine.x1 + ringTol
      );
    }

    function snapsToNetwork(px, py) {
      if (onBusLine(px, py)) return true;
      return nodes.some((n) => distToRing(px, py, n) <= ringTol);
    }

    if (qaDir === 'a') {
      for (const edge of flowEdges) {
        const el = document.getElementById(edge.pathId);
        if (!el) {
          violations.push({ kind: 'edge-missing', pathId: edge.pathId });
          continue;
        }
        let len = 0;
        try {
          len = el.getTotalLength();
        } catch {
          continue;
        }
        const start = el.getPointAtLength(0);
        const end = el.getPointAtLength(len);
        const fromN = nodeById(edge.from);
        const toN = nodeById(edge.to);
        const startOk = edge.from === 'bus' ? onBusLine(start.x, start.y) : distToRing(start.x, start.y, fromN) <= ringTol;
        if (!startOk) {
          violations.push({
            kind: 'edge-start',
            path: edge.pathId,
            from: edge.from,
            dist: edge.from === 'bus' ? Math.abs(start.y - (busLine?.y ?? 0)) : distToRing(start.x, start.y, fromN),
          });
        }
        if (distToRing(end.x, end.y, toN) > ringTol) {
          violations.push({
            kind: 'edge-end',
            path: edge.pathId,
            to: edge.to,
            dist: distToRing(end.x, end.y, toN),
          });
        }
      }

      function xReversesAlongPath(pts) {
        const tolY = 8;
        let runSign = 0;
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i - 1].x;
          const dy = pts[i].y - pts[i - 1].y;
          if (Math.abs(dy) > tolY && Math.abs(dx) < 6) continue;
          if (Math.abs(dx) < 1) continue;
          const s = Math.sign(dx);
          if (runSign === 0) runSign = s;
          else if (s !== runSign) return true;
        }
        return false;
      }

      const xExempt = new Set(['flow-pv1', 'flow-pv2', 'flow-pv-trunk', 'flow-bat', 'flow-noness']);
      for (const el of paths) {
        let len = 0;
        try {
          len = el.getTotalLength();
        } catch {
          continue;
        }
        if (len <= 0) continue;
        const start = el.getPointAtLength(0);
        const end = el.getPointAtLength(len);
        if (!snapsToNetwork(start.x, start.y)) {
          violations.push({ kind: 'float-start', path: el.id, at: { x: start.x, y: start.y } });
        }
        if (!snapsToNetwork(end.x, end.y)) {
          violations.push({ kind: 'float-end', path: el.id, at: { x: end.x, y: end.y } });
        }
        const pts = samplePath(el, 4);
        const ys = pts.map((p) => p.y);
        const ySpread = Math.max(...ys) - Math.min(...ys);
        const isLoadStub = el.id.startsWith('flow-L');
        if (!xExempt.has(el.id) && !isLoadStub && ySpread <= 6 && xReversesAlongPath(pts)) {
          violations.push({ kind: 'path-x-reverse', path: el.id });
        }
      }
    }

    return {
      ok: violations.length === 0,
      violations,
      pathCount: paths.length,
      textCount: texts.length,
      nodeCount: nodes.length,
    };
  });
}