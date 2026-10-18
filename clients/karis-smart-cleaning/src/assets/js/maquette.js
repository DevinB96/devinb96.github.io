// "Inside the clean": a procedural architectural maquette of a home, built with Three.js.
// Scroll assembles it (an exploded view coming together), the roof lifts off, and the camera
// visits each room while the walls in front drop away. Labels mark what gets cleaned.
// The same scene renders the still images used across the site (see tools/render.mjs).
import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const COL = {
  wall: '#f3eee6', board: '#e9e3d8', slab: '#ddd4c6', oak: '#d6bc97', oakDark: '#b99a72',
  stone: '#f4f1eb', tileWarm: '#ebe5da', tileCool: '#e1e7e3', spruce: '#2d5249', spruceDark: '#1f3c35',
  sage: '#9cb3a5', sageLight: '#cbd8cf', citrus: '#e8cf62', steel: '#c6cac6', dark: '#2f3532',
  glass: '#cfe2e4', roof: '#7d9387', terracotta: '#cf9b78', kraft: '#c8a479', linen: '#f7f3ec', leaf: '#8ea891',
};
const H = 2.6;       // wall height
const T = 0.14;      // wall thickness
const STUB = 0.32;   // height a wall drops to when cut away

const mats = new Map();
function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!mats.has(key)) {
    const m = o.physical
      ? new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: o.opacity ?? 0.3, envMapIntensity: 1.4, depthWrite: false })
      : new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.86, metalness: o.metal ?? 0, emissive: o.emissive || '#000000', emissiveIntensity: o.ei ?? 0, transparent: !!o.transparent, opacity: o.opacity ?? 1 });
    mats.set(key, m);
  }
  return mats.get(key);
}

function box(parent, w, h, d, color, x, y, z, o = {}) {
  const r = Math.min(o.r ?? 0.025, w / 2.01, h / 2.01, d / 2.01);
  const g = r > 0.004 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, o.material || mat(color, o));
  m.position.set(x, y + h / 2, z);
  m.castShadow = o.cast ?? true;
  m.receiveShadow = true;
  if (o.ry) m.rotation.y = o.ry;
  parent.add(m);
  return m;
}
function cyl(parent, rt, rb, h, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 28), mat(color, o));
  m.position.set(x, y + h / 2, z);
  m.castShadow = o.cast ?? true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function ball(parent, r, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(color, o));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (o.sy) m.scale.y = o.sy;
  parent.add(m);
  return m;
}

// A wall with window and door openings. axis 'x' runs along x at fixed z; 'z' along z at fixed x.
function wall(parent, axis, fixed, from, to, openings = []) {
  const g = new THREE.Group();
  parent.add(g);
  const seg = (a, b, y0, y1) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return;
    const len = b - a, mid = (a + b) / 2;
    if (axis === 'x') box(g, len, y1 - y0, T, COL.wall, mid, y0, fixed, { r: 0.01 });
    else box(g, T, y1 - y0, len, COL.wall, fixed, y0, mid, { r: 0.01 });
  };
  let cur = from;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    seg(cur, o.a, 0, H);
    seg(o.a, o.b, 0, o.sill);
    seg(o.a, o.b, o.head, H);
    const len = o.b - o.a, mid = (o.a + o.b) / 2, hh = o.head - o.sill;
    if (o.glass) {
      const pane = axis === 'x'
        ? box(g, len - 0.04, hh - 0.04, 0.02, COL.glass, mid, o.sill + 0.02, fixed, { r: 0, material: mat(COL.glass, { physical: true, opacity: 0.28 }), cast: false })
        : box(g, 0.02, hh - 0.04, len - 0.04, COL.glass, fixed, o.sill + 0.02, mid, { r: 0, material: mat(COL.glass, { physical: true, opacity: 0.28 }), cast: false });
      pane.renderOrder = 2;
      // Frame and a central glazing bar
      const fr = (w, h2, d, x, y, z) => box(g, w, h2, d, COL.stone, x, y, z, { r: 0.005 });
      if (axis === 'x') { fr(len, 0.05, T + 0.03, mid, o.sill - 0.02, fixed); fr(0.04, hh, 0.05, mid, o.sill, fixed); }
      else { fr(T + 0.03, 0.05, len, fixed, o.sill - 0.02, mid); fr(0.05, hh, 0.04, fixed, o.sill, mid); }
    }
    if (o.door) {
      if (axis === 'x') box(g, len - 0.06, o.head - 0.02, 0.05, COL.spruce, mid, 0, fixed + (o.door === 'out' ? T / 2 : 0), { r: 0.01 });
      else box(g, 0.05, o.head - 0.02, len - 0.06, COL.spruce, fixed, 0, mid, { r: 0.01 });
    }
    cur = o.b;
  }
  seg(cur, to, 0, H);
  // A dark cap reads like an architectural section when the wall is cut.
  const len = to - from, mid = (from + to) / 2;
  const cap = axis === 'x' ? box(g, len, 0.02, T + 0.002, COL.spruceDark, mid, H - 0.01, fixed, { r: 0 }) : box(g, T + 0.002, 0.02, len, COL.spruceDark, fixed, H - 0.01, mid, { r: 0 });
  cap.castShadow = false;
  g.userData = { y: 0, target: 0 };
  return g;
}

function buildHome() {
  const root = new THREE.Group();
  const parts = { walls: {}, movable: [], tenancyOnly: [], roof: null, assembly: [], hotspots: {} };
  const layer = (name, delay, dy) => { const g = new THREE.Group(); g.name = name; root.add(g); parts.assembly.push({ obj: g, delay, dy }); return g; };
  const hs = (key, x, y, z) => { parts.hotspots[key] = new THREE.Vector3(x, y, z); };

  // Model board, slab and floor finishes
  const base = layer('base', 0, -1.2);
  box(base, 14.2, 0.16, 12, COL.board, 0.2, -0.46, 0.6, { r: 0.08 });
  box(base, 10.5, 0.3, 8.5, COL.slab, 0, -0.3, 0, { r: 0.03 });
  const floors = layer('floors', 0.06, 1.5);
  box(floors, 5, 0.03, 4, COL.tileWarm, -2.5, 0, 2, { r: 0 });
  box(floors, 5, 0.03, 4, COL.oak, 2.5, 0, 2, { r: 0 });
  box(floors, 3.5, 0.03, 4, COL.tileCool, -3.25, 0, -2, { r: 0 });
  box(floors, 6.5, 0.03, 4, COL.oak, 1.75, 0, -2, { r: 0 });
  // Path and garden on the board
  const garden = layer('garden', 0.1, 1.2);
  for (let i = 0; i < 4; i++) box(garden, 0.9, 0.04, 0.42, COL.stone, 0.9, -0.3, 4.75 + i * 0.6, { r: 0.02 });
  const tree = (x, z, s) => { cyl(garden, 0.06 * s, 0.08 * s, 1.2 * s, COL.oakDark, x, -0.3, z); ball(garden, 0.75 * s, COL.leaf, x, -0.3 + 1.55 * s, z); ball(garden, 0.5 * s, COL.sage, x + 0.35 * s, -0.3 + 1.25 * s, z + 0.2 * s); };
  tree(6.4, 4.6, 0.85); tree(-6.2, 5.2, 0.7); tree(6.3, -4.4, 0.9);
  box(garden, 3.2, 0.5, 0.5, COL.leaf, -3.4, -0.3, 6.0, { r: 0.22 });

  // Walls
  const walls = layer('walls', 0.16, 3.2);
  const W = parts.walls;
  W.back = wall(walls, 'x', -4, -5.07, 5.07, [{ a: -4.4, b: -3.4, sill: 1.45, head: 2.15, glass: true }, { a: 0.9, b: 2.3, sill: 0.9, head: 2.15, glass: true }]);
  W.left = wall(walls, 'z', -5, -4, 4, [{ a: 1.85, b: 2.75, sill: 1.12, head: 2.1, glass: true }, { a: -2.9, b: -2.1, sill: 1.4, head: 2.1, glass: true }]);
  W.front = wall(walls, 'x', 4, -5.07, 5.07, [{ a: -3.4, b: -1.6, sill: 0.95, head: 2.15, glass: true }, { a: 0.55, b: 1.45, sill: 0, head: 2.15, door: 'out' }, { a: 2.3, b: 4.2, sill: 0.45, head: 2.2, glass: true }]);
  W.right = wall(walls, 'z', 5, -4, 4, [{ a: 1.4, b: 3.1, sill: 0.45, head: 2.2, glass: true }, { a: -1.3, b: -0.35, sill: 0.9, head: 2.1, glass: true }]);
  W.kitLiv = wall(walls, 'z', 0, 0.07, 3.93, [{ a: 0.9, b: 3.2, sill: 0, head: 2.25 }]);
  W.bathKit = wall(walls, 'x', 0, -5, -1.5, [{ a: -2.75, b: -1.95, sill: 0, head: 2.1 }]);
  W.bedLiv = wall(walls, 'x', 0, -1.5, 5, [{ a: 3.55, b: 4.4, sill: 0, head: 2.1 }]);
  W.bathBed = wall(walls, 'z', -1.5, -3.93, -0.07, []);

  // Kitchen (x -5..0, z 0..4): fitted units, island, fridge
  const kit = layer('kitchen', 0.38, 2.4);
  const ux = -4.62;
  [[0.82, 1.8], [1.82, 2.8], [2.82, 3.8]].forEach(([a, b]) => box(kit, 0.6, 0.84, b - a - 0.02, COL.spruce, ux, 0.02, (a + b) / 2, { r: 0.015 }));
  box(kit, 0.66, 0.04, 3.02, COL.stone, ux - 0.01, 0.86, 2.31, { r: 0.01 });
  box(kit, 0.02, 0.5, 3.0, COL.tileCool, -4.92, 0.9, 2.31, { r: 0, cast: false }); // splashback
  box(kit, 0.5, 0.012, 0.56, COL.dark, ux, 0.9, 3.31, { r: 0.004, rough: 0.25 });
  [[-0.12, -0.13], [0.12, -0.13], [-0.12, 0.13], [0.12, 0.13]].forEach(([dx, dz]) => cyl(kit, 0.075, 0.075, 0.006, '#555b58', ux + dx, 0.912, 3.31 + dz, { rough: 0.4 }));
  box(kit, 0.42, 0.016, 0.5, COL.steel, ux, 0.9, 1.31, { r: 0.005, metal: 0.6, rough: 0.3 });
  cyl(kit, 0.016, 0.016, 0.32, COL.steel, -4.86, 0.9, 1.31, { metal: 0.7, rough: 0.25 });
  box(kit, 0.2, 0.02, 0.03, COL.steel, -4.77, 1.2, 1.31, { r: 0.008, metal: 0.7, rough: 0.25 });
  box(kit, 0.52, 0.3, 0.62, COL.stone, -4.66, 1.62, 3.31, { r: 0.02 });
  box(kit, 0.26, 0.68, 0.32, COL.stone, -4.8, 1.92, 3.31, { r: 0.01 });
  box(kit, 0.66, 2.04, 0.7, COL.stone, -4.6, 0.02, 0.43, { r: 0.03 });
  box(kit, 0.025, 0.7, 0.03, COL.steel, -4.25, 0.9, 0.7, { r: 0.01, metal: 0.7, rough: 0.25 });
  box(kit, 0.9, 0.86, 1.8, COL.spruce, -2.4, 0.02, 2.1, { r: 0.02 });
  box(kit, 1.02, 0.045, 1.92, COL.stone, -2.4, 0.88, 2.1, { r: 0.015 });
  hs('worktop', -4.55, 0.98, 2.35); hs('hob', -4.55, 1.0, 3.31); hs('sink', -4.55, 1.0, 1.31); hs('hood', -4.5, 1.78, 3.31); hs('fridge', -4.25, 1.5, 0.43);

  // Kitchen loose items
  const kitLoose = layer('kitchen-loose', 0.55, 2.8);
  const stool = (x, z) => { const s = new THREE.Group(); cyl(s, 0.17, 0.17, 0.05, COL.oak, 0, 0.62, 0); cyl(s, 0.025, 0.04, 0.62, COL.dark, 0, 0, 0); cyl(s, 0.16, 0.16, 0.02, COL.dark, 0, 0, 0); s.position.set(x, 0.02, z); kitLoose.add(s); parts.movable.push(s); };
  stool(-1.62, 1.6); stool(-1.62, 2.6);
  const bowl = new THREE.Group();
  cyl(bowl, 0.17, 0.09, 0.08, COL.spruceDark, 0, 0, 0);
  [[0, 0.08, 0], [0.07, 0.07, 0.04], [-0.06, 0.07, 0.05], [0.02, 0.07, -0.07], [-0.03, 0.14, 0]].forEach(([x, y, z]) => ball(bowl, 0.05, COL.citrus, x, y + 0.03, z, { rough: 0.5 }));
  bowl.position.set(-2.45, 0.925, 2.35); kitLoose.add(bowl); parts.movable.push(bowl);
  const herb = new THREE.Group(); cyl(herb, 0.08, 0.06, 0.12, COL.terracotta, 0, 0, 0); ball(herb, 0.12, COL.leaf, 0, 0.2, 0, { sy: 0.8 });
  herb.position.set(-4.62, 0.9, 2.3); kitLoose.add(herb); parts.movable.push(herb);

  // Bathroom (x -5..-1.5, z -4..0)
  const bath = layer('bathroom', 0.42, 2.4);
  box(bath, 1.72, 0.56, 0.78, COL.stone, -3.9, 0.02, -3.5, { r: 0.08 });
  box(bath, 1.5, 0.02, 0.56, '#d6e7e5', -3.9, 0.5, -3.5, { r: 0.01, rough: 0.2 });
  cyl(bath, 0.02, 0.02, 0.3, COL.steel, -4.7, 0.56, -3.5, { metal: 0.7, rough: 0.25 });
  box(bath, 0.2, 0.42, 0.42, COL.stone, -4.82, 0.4, -1.55, { r: 0.04 });
  box(bath, 0.42, 0.38, 0.36, COL.stone, -4.55, 0.02, -1.55, { r: 0.12 });
  box(bath, 0.44, 0.03, 0.38, COL.stone, -4.55, 0.4, -1.55, { r: 0.012 });
  box(bath, 0.92, 0.78, 0.5, COL.sage, -2.3, 0.02, -3.65, { r: 0.02 });
  box(bath, 0.96, 0.05, 0.54, COL.stone, -2.3, 0.8, -3.64, { r: 0.015 });
  cyl(bath, 0.17, 0.13, 0.1, COL.stone, -2.3, 0.85, -3.62);
  cyl(bath, 0.014, 0.014, 0.22, COL.steel, -2.3, 0.85, -3.84, { metal: 0.7, rough: 0.25 });
  box(bath, 0.72, 0.82, 0.02, '#f1f5f4', -2.3, 1.15, -3.91, { r: 0.005, metal: 0.5, rough: 0.12 });
  hs('bath', -3.9, 0.75, -3.4); hs('mirror', -2.3, 1.7, -3.88); hs('basin', -2.3, 1.0, -3.55);
  const bathLoose = layer('bath-loose', 0.6, 2.8);
  const towel = box(bathLoose, 0.06, 0.62, 0.46, COL.sageLight, -4.88, 0.85, -0.75, { r: 0.02 }); parts.movable.push(towel);
  const bplant = new THREE.Group(); cyl(bplant, 0.07, 0.06, 0.12, COL.stone, 0, 0, 0); ball(bplant, 0.11, COL.leaf, 0, 0.2, 0);
  bplant.position.set(-3.05, 0.58, -3.78); bathLoose.add(bplant); parts.movable.push(bplant);

  // Living room (x 0..5, z 0..4)
  const liv = layer('living', 0.48, 2.6);
  const shelf = new THREE.Group();
  box(shelf, 0.36, 1.9, 0.9, COL.oak, 0, 0, 0, { r: 0.015 });
  [0.42, 0.86, 1.3].forEach((y, i) => {
    box(shelf, 0.3, 0.02, 0.82, COL.oakDark, 0.02, y, 0, { r: 0 });
    [COL.spruce, COL.citrus, COL.sage, COL.stone, COL.terracotta].forEach((c, j) => box(shelf, 0.22, 0.28 - ((i + j) % 3) * 0.04, 0.07, c, 0.04, y + 0.02, -0.33 + j * 0.13 + (i % 2) * 0.03, { r: 0.008 }));
  });
  shelf.position.set(4.73, 0.02, 0.62); liv.add(shelf); parts.movable.push(shelf);
  hs('shelf', 4.6, 1.75, 0.62); hs('rug', 2.4, 0.08, 2.75); hs('sofa', 2.4, 0.95, 0.5); hs('window', 4.9, 1.5, 2.25);
  const livLoose = layer('living-loose', 0.62, 3);
  const rug = box(livLoose, 2.9, 0.02, 1.9, COL.linen, 2.35, 0.03, 1.95, { r: 0.006 }); parts.movable.push(rug);
  const sofa = new THREE.Group();
  box(sofa, 2.3, 0.4, 0.92, COL.spruce, 0, 0.04, 0, { r: 0.08 });
  box(sofa, 2.3, 0.46, 0.24, COL.spruce, 0, 0.4, -0.34, { r: 0.08 });
  box(sofa, 0.22, 0.26, 0.92, COL.spruce, -1.04, 0.4, 0, { r: 0.08 });
  box(sofa, 0.22, 0.26, 0.92, COL.spruce, 1.04, 0.4, 0, { r: 0.08 });
  [-0.46, 0.46].forEach((x) => box(sofa, 0.88, 0.14, 0.68, COL.spruce, x, 0.42, 0.08, { r: 0.06 }));
  box(sofa, 0.42, 0.36, 0.12, COL.citrus, -0.65, 0.54, -0.18, { r: 0.05, ry: 0.15 });
  box(sofa, 0.42, 0.36, 0.12, COL.sageLight, 0.7, 0.54, -0.18, { r: 0.05, ry: -0.12 });
  sofa.position.set(2.4, 0.02, 0.6); livLoose.add(sofa); parts.movable.push(sofa);
  const table = new THREE.Group();
  box(table, 1.1, 0.06, 0.6, COL.oak, 0, 0.32, 0, { r: 0.02 });
  [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]].forEach(([x, z]) => cyl(table, 0.02, 0.02, 0.32, COL.oakDark, x, 0, z));
  box(table, 0.28, 0.04, 0.2, COL.spruce, -0.2, 0.38, 0.05, { r: 0.01 });
  cyl(table, 0.06, 0.05, 0.12, COL.stone, 0.25, 0.38, -0.05);
  table.position.set(2.4, 0.04, 1.85); livLoose.add(table); parts.movable.push(table);
  const chair = new THREE.Group();
  box(chair, 0.82, 0.4, 0.8, COL.sage, 0, 0.04, 0, { r: 0.08 });
  box(chair, 0.82, 0.42, 0.2, COL.sage, 0, 0.4, -0.3, { r: 0.08 });
  chair.rotation.y = -Math.PI / 2 + 0.35;
  chair.position.set(4.2, 0.02, 2.9); livLoose.add(chair); parts.movable.push(chair);
  const lamp = new THREE.Group();
  cyl(lamp, 0.14, 0.14, 0.02, COL.dark, 0, 0, 0); cyl(lamp, 0.012, 0.012, 1.45, COL.dark, 0, 0, 0);
  cyl(lamp, 0.13, 0.2, 0.26, COL.linen, 0, 1.45, 0, { emissive: '#ffdca8', ei: 0.35 });
  lamp.position.set(0.55, 0.02, 0.45); livLoose.add(lamp); parts.movable.push(lamp);
  const plant = new THREE.Group();
  cyl(plant, 0.2, 0.15, 0.42, COL.terracotta, 0, 0, 0);
  ball(plant, 0.34, COL.leaf, 0, 0.8, 0); ball(plant, 0.26, COL.sage, 0.15, 1.12, 0.08); ball(plant, 0.22, COL.leaf, -0.14, 1.05, -0.1);
  plant.position.set(0.55, 0.02, 3.45); livLoose.add(plant); parts.movable.push(plant);

  // Bedroom (x -1.5..5, z -4..0)
  const bed = layer('bedroom', 0.45, 2.4);
  const ward = new THREE.Group();
  box(ward, 0.62, 2.12, 1.62, COL.spruce, 0, 0, 0, { r: 0.015 });
  box(ward, 0.005, 2.0, 0.02, COL.spruceDark, 0.31, 0.06, 0, { r: 0, cast: false });
  [-0.12, 0.12].forEach((z) => box(ward, 0.03, 0.4, 0.025, COL.steel, 0.32, 0.9, z, { r: 0.008, metal: 0.6 }));
  ward.position.set(-1.1, 0.02, -2.45); bed.add(ward);
  hs('wardrobe', -0.75, 1.55, -2.45); hs('bed', 1.6, 0.78, -2.1); hs('bedside', 0.5, 0.82, -3.62);
  const bedLoose = layer('bedroom-loose', 0.6, 3);
  const bedFrame = new THREE.Group();
  box(bedFrame, 1.72, 0.3, 2.1, COL.oak, 0, 0.02, 0, { r: 0.04 });
  box(bedFrame, 1.62, 0.2, 2.0, COL.stone, 0, 0.3, 0, { r: 0.08 });
  box(bedFrame, 1.68, 0.06, 1.35, COL.sageLight, 0, 0.47, 0.34, { r: 0.03 });
  box(bedFrame, 1.68, 0.04, 0.3, COL.sage, 0, 0.5, 0.75, { r: 0.02 });
  [-0.4, 0.4].forEach((x) => box(bedFrame, 0.62, 0.14, 0.36, COL.linen, x, 0.5, -0.72, { r: 0.07 }));
  box(bedFrame, 1.82, 1.05, 0.09, COL.spruce, 0, 0.02, -1.08, { r: 0.04 });
  bedFrame.position.set(1.6, 0, -2.78); bedLoose.add(bedFrame); parts.movable.push(bedFrame);
  [0.5, 2.7].forEach((x) => {
    const g = new THREE.Group();
    box(g, 0.46, 0.5, 0.4, COL.oak, 0, 0, 0, { r: 0.02 });
    cyl(g, 0.05, 0.07, 0.18, COL.stone, 0, 0.5, 0);
    cyl(g, 0.1, 0.14, 0.17, COL.linen, 0, 0.68, 0, { emissive: '#ffdca8', ei: 0.35 });
    g.position.set(x, 0.02, -3.62); bedLoose.add(g); parts.movable.push(g);
  });
  const bedRug = box(bedLoose, 2.6, 0.02, 1.4, COL.sageLight, 1.6, 0.03, -1.35, { r: 0.006 }); parts.movable.push(bedRug);
  const bplant2 = new THREE.Group(); cyl(bplant2, 0.16, 0.12, 0.34, COL.stone, 0, 0, 0); ball(bplant2, 0.28, COL.leaf, 0, 0.62, 0); ball(bplant2, 0.2, COL.sage, 0.1, 0.86, 0.05);
  bplant2.position.set(4.55, 0.02, -3.55); bedLoose.add(bplant2); parts.movable.push(bplant2);

  // Moving boxes: only in the end of tenancy view
  const boxes = layer('boxes', 0.7, 3);
  const mbox = (x, y, z, w, h, d, ry = 0) => {
    const g = new THREE.Group();
    box(g, w, h, d, COL.kraft, 0, 0, 0, { r: 0.012 });
    box(g, w + 0.004, 0.012, 0.07, '#e6d3b3', 0, h - 0.008, 0, { r: 0, cast: false });
    g.position.set(x, y, z); g.rotation.y = ry; boxes.add(g); parts.tenancyOnly.push(g);
  };
  mbox(2.2, 0.03, 1.4, 0.6, 0.45, 0.45, 0.1); mbox(2.25, 0.48, 1.42, 0.5, 0.38, 0.4, -0.15); mbox(3.0, 0.03, 1.2, 0.55, 0.4, 0.42, 0.5);
  mbox(1.3, 0.03, -2.2, 0.6, 0.45, 0.45, -0.2); mbox(1.9, 0.03, -2.55, 0.5, 0.36, 0.4, 0.3); mbox(1.4, 0.48, -2.25, 0.48, 0.34, 0.38, 0.1);

  // Gable roof that lifts away (does not cast shadows, so the interior stays bright)
  const roof = new THREE.Group();
  const pitch = Math.PI / 6, half = 4.4, rise = 4 * Math.tan(pitch);
  const planeLen = half / Math.cos(pitch);
  [-1, 1].forEach((s) => {
    const p = new THREE.Group();
    const slab = box(p, 10.8, 0.14, planeLen, COL.roof, 0, -0.07, 0, { r: 0.02, cast: false });
    for (let i = 1; i < 9; i++) box(p, 10.8, 0.012, 0.03, '#6f857a', 0, 0.07, -planeLen / 2 + (i * planeLen) / 9, { r: 0, cast: false });
    slab.receiveShadow = false;
    p.position.set(0, H + rise - (half * Math.tan(pitch)) / 2 + 0.02, (s * half) / 2);
    p.rotation.x = s * pitch;
    p.userData.side = s;
    roof.add(p);
  });
  const tri = new THREE.Shape([new THREE.Vector2(-4.05, 0), new THREE.Vector2(4.05, 0), new THREE.Vector2(0, rise + 0.02)]);
  [-5.0, 5.0].forEach((x) => {
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: T, bevelEnabled: false }), mat(COL.wall));
    m.rotation.y = Math.PI / 2;
    m.position.set(x - T / 2, H, 0);
    m.receiveShadow = true;
    roof.add(m);
  });
  root.add(roof);
  parts.roof = roof;
  roof.userData = { lift: 0, liftTarget: 0 };

  return { root, parts };
}

function buildOffice() {
  const root = new THREE.Group();
  box(root, 13, 0.16, 11, COL.board, 0, -0.46, 0.4, { r: 0.08 });
  box(root, 9.5, 0.3, 7.5, COL.slab, 0, -0.3, 0, { r: 0.03 });
  box(root, 9.2, 0.03, 7.2, '#d9d6cf', 0, 0, 0, { r: 0 });
  const walls = {};
  walls.back = wall(root, 'x', -3.6, -4.67, 4.67, [{ a: -3.8, b: -1.8, sill: 0.8, head: 2.2, glass: true }, { a: 0.2, b: 2.2, sill: 0.8, head: 2.2, glass: true }]);
  walls.left = wall(root, 'z', -4.6, -3.6, 3.6, [{ a: -2.4, b: -0.4, sill: 0.8, head: 2.2, glass: true }]);
  walls.front = wall(root, 'x', 3.6, -4.67, 4.67, []);
  walls.right = wall(root, 'z', 4.6, -3.6, 3.6, []);
  walls.front.position.y = -(H - STUB); walls.right.position.y = -(H - STUB);
  const desk = (x, z, ry) => {
    const g = new THREE.Group();
    box(g, 1.5, 0.04, 0.75, COL.oak, 0, 0.72, 0, { r: 0.01 });
    [[-0.7, -0.33], [0.7, -0.33], [-0.7, 0.33], [0.7, 0.33]].forEach(([a, b]) => box(g, 0.04, 0.72, 0.04, COL.dark, a, 0, b, { r: 0.005 }));
    box(g, 0.6, 0.36, 0.03, COL.dark, 0, 0.92, -0.22, { r: 0.01, rough: 0.3 });
    box(g, 0.08, 0.16, 0.06, COL.dark, 0, 0.76, -0.22, { r: 0.01 });
    box(g, 0.42, 0.015, 0.14, COL.stone, 0, 0.76, 0.1, { r: 0.004 });
    const c = new THREE.Group();
    box(c, 0.5, 0.08, 0.5, COL.spruce, 0, 0.45, 0, { r: 0.04 }); box(c, 0.48, 0.5, 0.08, COL.spruce, 0, 0.55, 0.24, { r: 0.04 });
    cyl(c, 0.025, 0.025, 0.45, COL.dark, 0, 0, 0); cyl(c, 0.26, 0.26, 0.02, COL.dark, 0, 0, 0);
    c.position.set(0, 0, 0.62); g.add(c);
    g.position.set(x, 0.02, z); g.rotation.y = ry; root.add(g);
  };
  desk(-2.6, -1.0, 0); desk(-0.9, -1.0, 0); desk(-2.6, 0.75, Math.PI); desk(-0.9, 0.75, Math.PI);
  box(root, 1.0, 0.04, 2.2, COL.stone, 2.6, 0.74, -0.2, { r: 0.02 });
  cyl(root, 0.06, 0.12, 0.74, COL.dark, 2.6, 0.02, -0.2);
  [[2.0, -0.8], [2.0, 0.4], [3.2, -0.8], [3.2, 0.4]].forEach(([x, z]) => { box(root, 0.44, 0.44, 0.44, COL.sage, x, 0.02, z, { r: 0.1 }); });
  box(root, 0.6, 0.9, 2.4, COL.spruce, 4.15, 0.02, -2.2, { r: 0.015 });
  box(root, 0.64, 0.04, 2.44, COL.stone, 4.15, 0.92, -2.2, { r: 0.01 });
  [[-4.1, 3.0], [4.1, 3.0], [-4.1, -3.1]].forEach(([x, z]) => { cyl(root, 0.22, 0.16, 0.46, COL.terracotta, x, 0.02, z); ball(root, 0.4, COL.leaf, x, 0.95, z); ball(root, 0.28, COL.sage, x + 0.15, 1.3, z); });
  box(root, 0.02, 2.3, 3.0, COL.glass, 1.2, 0.02, -2.0, { r: 0, material: mat(COL.glass, { physical: true, opacity: 0.25 }), cast: false });
  box(root, 3.4, 0.02, 2.4, COL.sageLight, 2.6, 0.03, -0.2, { r: 0.004 });
  return { root };
}

/* ---------- Camera views ---------- */
const VIEWS = {
  overview: { pos: [15.5, 14.2, 21], target: [0, 1.9, 0.4], cut: { front: 0.9, right: 0.9 }, roof: 1 },
  kitchen: { pos: [1.6, 5.4, 8.6], target: [-2.9, 0.75, 1.9], cut: { front: STUB, right: 0.9, kitLiv: STUB }, roof: 2 },
  bathroom: { pos: [-1.6, 8.2, 5.0], target: [-3.3, 0.5, -2.2], cut: { front: STUB, right: 0.9, bathKit: STUB, kitLiv: STUB }, roof: 2 },
  living: { pos: [7.4, 5.0, 8.8], target: [2.4, 0.6, 1.75], cut: { front: STUB, right: STUB, kitLiv: STUB }, roof: 2 },
  bedroom: { pos: [9.4, 6.4, -0.4], target: [1.5, 0.45, -2.45], cut: { front: STUB, right: STUB, kitLiv: STUB }, roof: 2 },
  exterior: { pos: [10.4, 2.9, 14.2], target: [-0.2, 1.75, 0.4], cut: {}, roof: 0, fov: 30 },
  office: { pos: [8.2, 7.6, 9.6], target: [0, 0.5, -0.4], cut: {} },
};

function setupRenderer(canvas, { preserve = false, shadowSize = 2048 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: preserve, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight('#ffffff', '#d8cfc0', 0.85));
  const sun = new THREE.DirectionalLight('#fff3df', 2.5);
  sun.position.set(9, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 4;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.47;
  ground.receiveShadow = true;
  scene.add(ground);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.5, 120);
  return { renderer, scene, camera };
}

const easeOut = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

// Distance multiplier so narrow (portrait) frames still fit the model.
const fitFactor = (aspect) => (aspect >= 1.15 ? 1 : 1 + (1.15 - aspect) * 1.05);

function applyStatic(home, view, level) {
  const { parts } = home;
  for (const [id, g] of Object.entries(parts.walls)) g.position.y = view.cut[id] != null ? -(H - view.cut[id]) : 0;
  parts.movable.forEach((m) => { m.visible = level !== 'tenancy'; });
  parts.tenancyOnly.forEach((m) => { m.visible = level === 'tenancy'; });
  setRoof(parts.roof, view.roof ?? 1);
}
function setRoof(roof, lift) {
  // lift 0 = on the house, 1 = hovering and split (exploded), 2 = gone
  const l1 = Math.min(1, lift), l2 = Math.max(0, lift - 1);
  roof.position.y = l1 * 3.6 + l2 * 8;
  roof.children.forEach((c) => {
    if (c.userData.side) { c.position.z = (c.userData.side * 4.4) / 2 + c.userData.side * l1 * 1.5; }
  });
  roof.visible = lift < 1.98;
}

/* ---------- Live, scroll-driven scene ---------- */
export async function mount(container, { data, level: startLevel, room: startRoom, section }) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);
  const small = innerWidth < 760;
  const { renderer, scene, camera } = setupRenderer(canvas, { shadowSize: small ? 1024 : 2048 });
  const home = buildHome();
  scene.add(home.root);
  const { parts } = home;
  parts.assembly.forEach((a) => { a.obj.userData.baseY = a.obj.position.y; });
  parts.roof.userData.baseY = 0;
  parts.movable.forEach((m) => { m.userData.s = 1; m.userData.base = m.scale.clone(); });
  parts.tenancyOnly.forEach((m) => { m.userData.s = 0; m.userData.base = m.scale.clone(); m.scale.setScalar(0.001); m.visible = false; });

  // Hotspot labels
  const layer = container.querySelector('.maquette-hotspots');
  const labels = [];
  data.forEach((r) => r.hotspots.forEach((h) => {
    const p = parts.hotspots[h.key];
    if (!p) return;
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.innerHTML = `<i></i><span>${h.t}</span>`;
    layer.appendChild(el);
    labels.push({ el, p, room: r.id, levels: h.in });
  }));

  let level = startLevel, room = startRoom, motion = true;
  let visible = true, raf = 0, last = performance.now(), idleFrames = 0;
  let assemble = 0, assembleTarget = 0;
  const cam = { pos: new THREE.Vector3(...VIEWS.overview.pos), target: new THREE.Vector3(...VIEWS.overview.target) };
  const goal = { pos: cam.pos.clone(), target: cam.target.clone() };
  let roofLift = 1, roofGoal = 1;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  container.addEventListener('pointermove', (e) => {
    const r = container.getBoundingClientRect();
    ptr.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  container.addEventListener('pointerleave', () => { ptr.tx = 0; ptr.ty = 0; });

  function applyView() {
    const v = VIEWS[room] || VIEWS.overview;
    const t = new THREE.Vector3(...v.target);
    const off = new THREE.Vector3(...v.pos).sub(t).multiplyScalar(fitFactor(camera.aspect));
    goal.target.copy(t);
    goal.pos.copy(t).add(off);
    for (const [id, g] of Object.entries(parts.walls)) g.userData.target = v.cut[id] != null ? -(H - v.cut[id]) : 0;
    roofGoal = v.roof ?? 1;
  }
  function setLevel(next) {
    level = next;
    parts.movable.forEach((m) => { m.userData.goal = next === 'tenancy' ? 0 : 1; });
    parts.tenancyOnly.forEach((m) => { m.userData.goal = next === 'tenancy' ? 1 : 0; });
    wake();
  }
  function setRoom(next) { room = next; applyView(); wake(); }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    applyView();
    wake();
  }
  new ResizeObserver(resize).observe(container);

  // Scroll progress: the model assembles as the section arrives.
  const stage = section.querySelector('.inside-stage');
  const onScroll = () => {
    const top = stage.getBoundingClientRect().top;
    assembleTarget = Math.min(1, Math.max(0, (innerHeight * 0.95 - top) / (innerHeight * 0.85)));
    wake();
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Use the latest entry: several changes can arrive in one batch after a fast scroll.
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; wake(); }).observe(container);
  document.addEventListener('visibilitychange', () => wake());
  function wake() { idleFrames = 0; if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  const tmp = new THREE.Vector3();
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = (rate) => 1 - Math.exp(-dt * rate);
    let moving = false;
    const approach = (cur, to, rate) => { const d = to - cur; if (Math.abs(d) > 0.0005) moving = true; return cur + d * k(rate); };

    assemble = approach(assemble, assembleTarget, 4);
    for (const a of parts.assembly) {
      const local = easeOut((assemble - a.delay) / 0.32);
      a.obj.position.y = a.obj.userData.baseY + a.dy * (1 - local);
    }
    // The roof drops in last, hovers split above the house, then lifts away for room views.
    roofLift = approach(roofLift, roofGoal, 2.2);
    setRoof(parts.roof, roofLift);
    const drop = 6 * (1 - easeOut((assemble - 0.62) / 0.33));
    if (drop > 0.01) { parts.roof.position.y += drop; parts.roof.visible = true; }

    for (const g of Object.values(parts.walls)) { g.userData.y = approach(g.userData.y, g.userData.target, 3); g.position.y = g.userData.y; }
    for (const m of [...parts.movable, ...parts.tenancyOnly]) {
      if (m.userData.goal == null) continue;
      m.userData.s = approach(m.userData.s, m.userData.goal, 5);
      const s = Math.max(0.001, easeOut(m.userData.s));
      m.scale.set(m.userData.base.x * s, m.userData.base.y * s, m.userData.base.z * s);
      m.visible = m.userData.s > 0.01;
    }

    ptr.x += (ptr.tx - ptr.x) * k(3);
    ptr.y += (ptr.ty - ptr.y) * k(3);
    cam.pos.lerp(goal.pos, k(2.4));
    cam.target.lerp(goal.target, k(2.6));
    if (cam.pos.distanceToSquared(goal.pos) > 1e-4) moving = true;
    const t = now / 1000;
    const sway = motion ? 1 : 0;
    tmp.copy(cam.pos).sub(cam.target);
    const ang = sway * (Math.sin(t * 0.25) * 0.035 + ptr.x * 0.06);
    tmp.applyAxisAngle(THREE.Object3D.DEFAULT_UP, ang);
    tmp.y += sway * ptr.y * -0.4;
    camera.position.copy(cam.target).add(tmp);
    camera.lookAt(cam.target);
    renderer.render(scene, camera);

    // Labels for the current room and level
    const w = container.clientWidth, h = container.clientHeight;
    const settled = cam.pos.distanceToSquared(goal.pos) < 0.6 && assemble > 0.9;
    for (const L of labels) {
      const on = settled && L.room === room && L.levels.includes(level);
      L.el.classList.toggle('is-on', on);
      if (!on && !L.el.classList.contains('is-on')) continue;
      tmp.copy(L.p).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      L.el.classList.toggle('flip', x > w * 0.62);
      L.el.style.transform = `translate(${(x - (x > w * 0.62 ? L.el.offsetWidth - 6 : 6)).toFixed(1)}px, ${(y - 6).toFixed(1)}px)`;
    }

    idleFrames = moving ? 0 : idleFrames + 1;
    const keepGoing = visible && !document.hidden && (motion || idleFrames < 30);
    raf = keepGoing ? requestAnimationFrame(tick) : 0;
  }

  setLevel(startLevel);
  resize();
  cam.pos.copy(goal.pos);
  cam.target.copy(goal.target);
  return {
    setRoom,
    setLevel,
    toggleMotion() { motion = !motion; wake(); return !motion; },
  };
}

/* ---------- Still renders (used by tools/render.mjs) ---------- */
export function renderStill(canvas, { view, level = 'regular', width, height, scene: which = 'home' }) {
  const { renderer, scene, camera } = setupRenderer(canvas, { preserve: true, shadowSize: 4096 });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  const v = VIEWS[view];
  if (v.fov) camera.fov = v.fov;
  camera.updateProjectionMatrix();
  if (which === 'office') scene.add(buildOffice().root);
  else {
    const home = buildHome();
    scene.add(home.root);
    applyStatic(home, v, level);
  }
  const t = new THREE.Vector3(...v.target);
  camera.position.copy(t).add(new THREE.Vector3(...v.pos).sub(t).multiplyScalar(fitFactor(camera.aspect)));
  camera.lookAt(t);
  renderer.render(scene, camera);
}
