// ── Inlined from topojson-client@3 feature() ──────────────────────────────────
// Eliminates the topojson-client dependency (~15KB) for a single function call.
function feature(topology, o) {
  if (typeof o === 'string') o = topology.objects[o];
  return o.type === 'GeometryCollection'
    ? { type: 'FeatureCollection', features: o.geometries.map(f => _feature(topology, f)) }
    : _feature(topology, o);
}
function _feature(topology, o) {
  const id = o.id, bbox = o.bbox;
  const properties = o.properties == null ? {} : o.properties;
  const geometry = o.type === 'GeometryCollection'
    ? { type: 'GeometryCollection', geometries: o.geometries.map(g => _geom(topology, g)) }
    : _geom(topology, o);
  const f = { type: 'Feature', geometry, properties };
  if (id !== undefined) f.id = id;
  if (bbox !== undefined) f.bbox = bbox;
  return f;
}
function _geom(topology, o) {
  if (o.type === 'GeometryCollection') return { type: 'GeometryCollection', geometries: o.geometries.map(g => _geom(topology, g)) };
  if (o.type === 'Point' || o.type === 'MultiPoint') return { type: o.type, coordinates: _point(topology, o) };
  const arcs = _arcCoords(topology, o);
  return arcs == null ? { type: null } : { type: o.type, coordinates: arcs };
}
function _point(topology, o) {
  if (o.type === 'Point') return _stitch(topology, [o.arcs])[0];
  return o.arcs.map(a => _stitch(topology, [a])[0]);
}
function _arcCoords(topology, o) {
  switch (o.type) {
    case 'Polygon':      return _stitch(topology, o.arcs);
    case 'MultiPolygon': return o.arcs.map(a => _stitch(topology, a));
    case 'LineString':   return _stitch(topology, [o.arcs])[0];
    case 'MultiLineString': return o.arcs.map(a => _stitch(topology, [a])[0]);
    default: return null;
  }
}
function _stitch(topology, arcs) {
  const stitched = [];
  const q  = topology.transform;
  const kx = q ? q.scale[0]     : 1, ky = q ? q.scale[1]     : 1;
  const dx = q ? q.translate[0] : 0, dy = q ? q.translate[1] : 0;

  for (const ring of arcs) {
    const pts = [];
    for (let i = 0; i < ring.length; i++) {
      const arcIdx = ring[i];
      const a = topology.arcs[arcIdx < 0 ? ~arcIdx : arcIdx];

      // Delta-decode this arc with a fresh accumulator.
      // CRITICAL: x0/y0 MUST reset to 0 for every arc, not every ring.
      // The previous implementation reset once per ring, producing wrong
      // geographic coordinates for any arc after the first in a ring.
      let x0 = 0, y0 = 0;
      const decoded = new Array(a.length);
      for (let k = 0; k < a.length; k++) {
        x0 += a[k][0];
        y0 += a[k][1];
        decoded[k] = [x0 * kx + dx, y0 * ky + dy];
      }
      if (arcIdx < 0) decoded.reverse();

      // Pop the last accumulated point before appending the next arc
      // (junction dedup — the shared endpoint appears at end of arc i
      // and start of arc i+1; keep only one copy).
      if (pts.length) pts.pop();
      for (const p of decoded) pts.push(p);
    }
    stitched.push(pts);
  }
  return stitched;
}

// ── Geometry helpers (no Three.js — pure math only) ───────────────────────────
function latLonToXYZ(lat, lon) {
  const phi = lat * Math.PI / 180;
  const lam = lon * Math.PI / 180;
  return [
    Math.cos(phi) * Math.sin(lam),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(lam),
  ];
}

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function inGeom(lon, lat, geom) {
  const c = geom.coordinates;
  if (geom.type === 'Polygon') {
    if (!inRing(lon, lat, c[0])) return false;
    for (let h = 1; h < c.length; h++) if (inRing(lon, lat, c[h])) return false;
    return true;
  }
  if (geom.type === 'MultiPolygon') {
    for (const poly of c) {
      if (!inRing(lon, lat, poly[0])) continue;
      let hole = false;
      for (let h = 1; h < poly.length; h++) if (inRing(lon, lat, poly[h])) { hole = true; break; }
      if (!hole) return true;
    }
  }
  return false;
}

// Pre-extracted float RGB values — avoids THREE.Color in the worker
const INDIA = [0.9804, 0.9804, 0.9804]; // #fafafa
const LAND  = [0.3333, 0.3333, 0.3333]; // #555555

self.onmessage = async ({ data: { dotCount } }) => {
  try {
    const resp = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const topo = await resp.json();
    const geo  = feature(topo, topo.objects.countries);

    const indiaGeom = geo.features.find(f => +f.id === 356)?.geometry ?? null;
    const landGeoms = geo.features.filter(f => +f.id !== 356).map(f => f.geometry);

    const pos    = [];
    const col    = [];
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < dotCount; i++) {
      const y   = 1 - (i / (dotCount - 1)) * 2;
      const r   = Math.sqrt(Math.max(0, 1 - y * y));
      const th  = golden * i;
      const lat = Math.asin(Math.max(-1, Math.min(1, y))) * (180 / Math.PI);
      const lon = Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * (180 / Math.PI);

      let isLand = false, isIndia = false;
      if (indiaGeom && inGeom(lon, lat, indiaGeom)) { isLand = true; isIndia = true; }
      else { for (const g of landGeoms) { if (inGeom(lon, lat, g)) { isLand = true; break; } } }
      if (!isLand) continue;

      const xyz = latLonToXYZ(lat, lon);
      pos.push(xyz[0], xyz[1], xyz[2]);
      const c = isIndia ? INDIA : LAND;
      col.push(c[0], c[1], c[2]);
    }

    // Transferable buffers — zero-copy back to main thread, avoids serialising ~500KB
    const positions = new Float32Array(pos);
    const colors    = new Float32Array(col);
    self.postMessage({ positions, colors }, [positions.buffer, colors.buffer]);

  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
