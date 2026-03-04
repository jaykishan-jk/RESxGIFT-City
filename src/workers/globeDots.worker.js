import { feature } from 'topojson-client';

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
