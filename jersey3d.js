// Maillot 3D (Three.js) : vrai modèle de maillot « fantôme » (models/maillot.glb, CC-BY Gabrielelel)
// sur lequel on projette les photos réelles du maillot : face à l'avant, dos à l'arrière.
// window.Jersey3D = { viewer(canvas, opts), thumb(design) } ; événement 'jersey3d-ready'.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const mobile = matchMedia('(pointer: coarse)').matches;
const HAUT = 2.2;                       // hauteur du maillot en unités 3D
const clair = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 160; };
const ombre = (h, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(h.substr(i, 2), 16) * k))).toString(16).padStart(2, '0')).join('');

// ---------- Forme du maillot (chargée une fois) ----------
let FORME = null;
const formePrete = new Promise(res => {
  const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
  L.load('models/maillot.glb', g => {
    g.scene.updateMatrixWorld(true);
    const geos = [];
    g.scene.traverse(m => {
      if (!m.isMesh) return;
      // les points sont compressés (entiers 16 bits) : on repasse en décimal avant de transformer
      const src = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
      const pos = src.attributes.position, n = pos.count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = pos.getX(i); arr[i * 3 + 1] = pos.getY(i); arr[i * 3 + 2] = pos.getZ(i); }
      const ge = new THREE.BufferGeometry();
      ge.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const uv = src.attributes.uv;
      if (uv) { const u2 = new Float32Array(n * 2); for (let i = 0; i < n; i++) { u2[i * 2] = uv.getX(i); u2[i * 2 + 1] = uv.getY(i); } ge.setAttribute('uv', new THREE.BufferAttribute(u2, 2)); }
      ge.applyMatrix4(m.matrixWorld);
      geos.push(ge);
    });
    const geo = mergeGeometries(geos);
    geo.computeBoundingBox();
    const b = geo.boundingBox, c = b.getCenter(new THREE.Vector3());
    const s = HAUT / (b.max.y - b.min.y);
    geo.translate(-c.x, -c.y, -c.z); geo.scale(s, s, s);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    // repères du torse : col (haut), ourlet (bas), largeur du torse sous les manches
    const p = geo.attributes.position, bb = geo.boundingBox;
    const yTop = bb.max.y, yHem = bb.min.y, yb = yHem + (yTop - yHem) * .28, ep = (yTop - yHem) * .05;
    let xL = 0, xR = 0;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (Math.abs(y - yb) < ep) { xL = Math.min(xL, p.getX(i)); xR = Math.max(xR, p.getX(i)); } }
    FORME = { geo, yTop, yHem, xL, xR };
    res(FORME);
  }, undefined, e => { console.error('maillot.glb', e); res(null); });
});

// ---------- Photos ----------
function charger(src) {
  return new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
// photo « débordée » : les zones vides prennent la couleur du tissu le plus proche
// (pyramide d'images : chaque niveau réduit sert de fond au niveau plus grand)
function deborder(img, W, H) {
  const niv = [];
  let w = W, h = H;
  while (true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(niv.length ? niv[niv.length - 1] : img, 0, 0, w, h);
    niv.push(c);
    if (w <= 4 || h <= 4) break;
    w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
  }
  const p = niv[niv.length - 1].getContext('2d');
  for (let i = 0; i < 12; i++) p.drawImage(niv[niv.length - 1], 0, 0);
  for (let i = niv.length - 2; i >= 0; i--) {
    const c = niv[i], x = c.getContext('2d'), t = document.createElement('canvas');
    t.width = c.width; t.height = c.height;
    const y = t.getContext('2d'); y.drawImage(niv[i + 1], 0, 0, c.width, c.height); y.drawImage(c, 0, 0);
    niv[i] = t;
  }
  return niv[0];
}
// position du torse dans la photo (part opaque) : gauche/droite sous les manches, haut du col, bas
const MESURES = new WeakMap();
function mesurer(img) {
  if (MESURES.has(img)) return MESURES.get(img);
  const w = 180, h = Math.max(1, Math.round(180 * img.naturalHeight / img.naturalWidth));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const ligne = y => { let g = -1, dr = -1; for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 120) { if (g < 0) g = i; dr = i; } return [g, dr]; };
  let gs = 0, ds = 0, n = 0;
  for (let y = Math.round(h * .6); y < h * .8; y++) { const [g, dr] = ligne(y); if (g >= 0) { gs += g; ds += dr; n++; } }
  let haut = 0; while (haut < h - 1 && ligne(haut)[0] < 0) haut++;
  let bas = h - 1; while (bas > 0 && ligne(bas)[0] < 0) bas--;
  const ratio = img.naturalWidth / img.naturalHeight;
  const m = n ? { g: gs / n / w, d: ds / n / w, haut: haut / h, bas: (bas + 1) / h, ratio } : { g: .2, d: .8, haut: 0, bas: 1, ratio };
  MESURES.set(img, m);
  return m;
}
// passage coordonnées du modèle (x, y) → coordonnées de la photo (u, v), v vers le bas
function projection(m, F, dos) {
  const torse = F.xR - F.xL;
  const a = (m.d - m.g) / torse * (dos ? -1 : 1);
  const b = dos ? m.g - a * F.xR : m.g - a * F.xL;
  const kNat = Math.abs(a) * m.ratio;                         // garde les proportions de la photo
  const kFit = (m.bas - m.haut) / (F.yTop - F.yHem);          // col → ourlet
  const k = Math.min(kNat * 1.25, Math.max(kNat * .85, kFit));
  return new THREE.Vector4(a, b, -k, m.haut + k * F.yTop);
}

// Dos : nom et numéro du flocage imprimés sur la photo du dos
function texteDos(ctx, D, cx, yNom, yNum, torse) {
  const fond = D.base || '#888';
  const txt = D.txt || (clair(fond) ? '#111' : (D.c3 && D.c3 !== fond && clair(D.c3) !== clair(fond) ? D.c3 : '#fff'));
  ctx.fillStyle = txt; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowOffsetY = torse * .008;
  if (D.nom) {
    let fs = torse * .16; ctx.font = `900 ${fs}px Archivo, Impact, sans-serif`;
    while (ctx.measureText(D.nom).width * .78 > torse * .78 && fs > 8) { fs *= .94; ctx.font = `900 ${fs}px Archivo, Impact, sans-serif`; }
    ctx.save(); ctx.translate(cx, yNom); ctx.scale(.78, 1); ctx.fillText(D.nom, 0, 0); ctx.restore();
  }
  if (D.num) {
    let fs = torse * .62; ctx.font = `900 ${fs}px Archivo, Impact, sans-serif`;
    while (ctx.measureText(D.num).width * .68 > torse * .74 && fs > 20) { fs *= .95; ctx.font = `900 ${fs}px Archivo, Impact, sans-serif`; }
    ctx.lineWidth = torse * .012; ctx.strokeStyle = ombre(txt === '#fff' ? fond : txt, .55);
    ctx.save(); ctx.translate(cx, yNum); ctx.scale(.68, 1); ctx.strokeText(D.num, 0, 0); ctx.fillText(D.num, 0, 0); ctx.restore();
  }
  ctx.shadowColor = 'transparent';
}

// ---------- Matériau : projection des deux photos ----------
function materiau() {
  const u = {
    tFace: { value: null }, tDos: { value: null }, pFace: { value: new THREE.Vector4() }, pDos: { value: new THREE.Vector4() },
    aFace: { value: 0 }, aDos: { value: 0 }, base: { value: new THREE.Color('#888') },
  };
  const m = new THREE.MeshStandardMaterial({ roughness: .7, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPo; varying vec3 vNo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPo = position; vNo = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPo; varying vec3 vNo;
        uniform sampler2D tFace; uniform sampler2D tDos; uniform vec4 pFace; uniform vec4 pDos;
        uniform float aFace; uniform float aDos; uniform vec3 base;
        vec3 photo(sampler2D t, vec4 p, float actif) {
          if (actif < .5) return base;
          vec2 uv = vec2(p.x * vPo.x + p.y, p.z * vPo.y + p.w);
          vec4 c = texture2D(t, clamp(vec2(uv.x, 1. - uv.y), .002, .998));
          return mix(base, c.rgb, c.a);
        }`)
      .replace('#include <map_fragment>', `
        float wf = smoothstep(-.35, .35, normalize(vNo).z);
        vec3 col = mix(photo(tDos, pDos, aDos), photo(tFace, pFace, aFace), wf);
        if (!gl_FrontFacing) col *= .32;          // intérieur du maillot (col, manches)
        diffuseColor.rgb = col;`);
  };
  m.userData.u = u;
  return m;
}

// Maillot redessiné : une texture « patron » (devant, dos, manches, col) posée sur le patron UV du modèle,
// avec le flocage (nom + numéro) imprimé au dos aux repères de models/patron.json
const REPERES = fetch('models/patron.json?v=2').then(r => r.json()).catch(() => null);
function maillotPatron(D) {
  const F = FORME;
  const mat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: 0, side: THREE.DoubleSide, color: D.base || '#888' });
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb *= .35;');
  };
  const g = new THREE.Group();
  g.add(new THREE.Mesh(F.geo, mat));
  const etat = { D: { ...D }, img: null, R: null, c: null, t: null };
  const dessiner = () => {
    const { img, R, D: D2 } = etat;
    if (!img) return;
    if (!etat.c) { etat.c = document.createElement('canvas'); etat.c.width = img.naturalWidth; etat.c.height = img.naturalHeight; }
    const c = etat.c, x = c.getContext('2d'), k = c.width / (R ? R.S : 2048);
    x.drawImage(img, 0, 0);
    if (R && (D2.nom || D2.num)) {
      // le dos est retourné haut/bas dans le patron : on écrit à l'envers pour qu'il se lise à l'endroit sur le maillot
      const largeur = R.largeurDos * k * .95;
      const ecrire = (pt, f) => { x.save(); x.translate(pt[0] * k, pt[1] * k); x.scale(1, -1); f(); x.restore(); };
      ecrire(R.nom, () => texteDos(x, { ...D2, num: '' }, 0, largeur * .05, 0, largeur));
      ecrire(R.num, () => texteDos(x, { ...D2, nom: '' }, 0, 0, largeur * .22, largeur));
    }
    if (!etat.t) { etat.t = new THREE.CanvasTexture(c); etat.t.colorSpace = THREE.SRGBColorSpace; etat.t.flipY = false; etat.t.anisotropy = 8; mat.map = etat.t; mat.color.set('#fff'); mat.needsUpdate = true; }
    etat.t.needsUpdate = true;
  };
  g.redessiner = nd => { Object.assign(etat.D, nd); dessiner(); };
  g.liberer = () => { etat.t && etat.t.dispose(); mat.dispose(); };
  g.pret = Promise.all([charger(D.atlas), REPERES]).then(([img, R]) => { etat.img = img; etat.R = R; dessiner(); });
  return g;
}

function creerMaillot(D) {
  if (D.atlas) return maillotPatron(D);
  const F = FORME;
  const mat = materiau();
  const u = mat.userData.u;
  u.base.value.set(D.base || '#888');
  const g = new THREE.Group();
  g.add(new THREE.Mesh(F.geo, mat));
  const etat = { D: { ...D }, face: null, dos: null, cDos: null, tDos: null, tFace: null };
  const majDos = () => {
    const D2 = etat.D, img = etat.dos;
    if (!img && !D2.nom && !D2.num) { u.aDos.value = 0; return; }
    // toile : photo du dos (ou fond uni) + flocage
    const W = img ? Math.min(1024, img.naturalWidth) : 512;
    const Hh = img ? Math.round(W * img.naturalHeight / img.naturalWidth) : 640;
    if (!etat.cDos) etat.cDos = document.createElement('canvas');
    const c = etat.cDos; c.width = W; c.height = Hh;
    const x = c.getContext('2d');
    let m;
    if (img) { x.drawImage(deborder(img, W, Hh), 0, 0); m = mesurer(img); }
    else { x.fillStyle = D2.base || '#888'; x.fillRect(0, 0, W, Hh); m = { g: .2, d: .8, haut: 0, bas: 1, ratio: W / Hh }; }
    const p = projection(m, F, true);
    const vAt = y => (p.z * y + p.w) * Hh;
    const H = F.yTop - F.yHem;
    texteDos(x, D2, (m.g + m.d) / 2 * W, vAt(F.yTop - H * .2), vAt(F.yTop - H * .56), (m.d - m.g) * W);
    if (!etat.tDos) { etat.tDos = new THREE.CanvasTexture(c); etat.tDos.colorSpace = THREE.SRGBColorSpace; etat.tDos.anisotropy = 4; }
    etat.tDos.needsUpdate = true;
    u.tDos.value = etat.tDos; u.pDos.value.copy(p); u.aDos.value = 1;
  };
  g.redessiner = nd => { Object.assign(etat.D, nd); if (nd.base) u.base.value.set(nd.base); majDos(); };
  g.liberer = () => { mat.dispose(); etat.tDos && etat.tDos.dispose(); etat.tFace && etat.tFace.dispose(); };
  g.pret = Promise.all([charger(D.photoFace), charger(D.photoDos)]).then(([f, d]) => {
    etat.face = f; etat.dos = d;
    if (f) {
      etat.tFace = new THREE.CanvasTexture(deborder(f, Math.min(1024, f.naturalWidth), Math.round(Math.min(1024, f.naturalWidth) * f.naturalHeight / f.naturalWidth))); etat.tFace.colorSpace = THREE.SRGBColorSpace; etat.tFace.anisotropy = 4; etat.tFace.needsUpdate = true;
      u.tFace.value = etat.tFace; u.pFace.value.copy(projection(mesurer(f), F, false)); u.aFace.value = 1;
    }
    majDos();
  });
  return g;
}

// ---------- Scène ----------
function scene(renderer) {
  const s = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  s.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  s.environmentIntensity = .6;
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(3, 3.5, 3.5); s.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(-3, 2, -3); s.add(rim);
  s.add(new THREE.AmbientLight(0xffffff, .15));
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = -HAUT / 2 - .12; s.add(sh);
  return s;
}
function nouveauRendu(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0;
  return r;
}
const distance = (cam, marge) => (HAUT * marge) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) / Math.min(1, cam.aspect * 1.05);

// ---------- Visionneuse interactive ----------
function viewer(canvas, opts = {}) {
  const renderer = nouveauRendu(canvas);
  const sc = scene(renderer);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 50); cam.position.set(0, .05, 6);
  let maillot = null, jeton = 0;
  let rot = opts.rotation || 0, vit = 0, cible = null, drag = false, lastX = 0, moved = 0, visible = true, auto = opts.auto !== false;
  const set = async D => {
    const j = ++jeton;
    await formePrete;
    if (j !== jeton || !FORME) return;
    const m = creerMaillot(D);
    await m.pret;
    if (j !== jeton) { m.liberer(); return; }
    if (maillot) { sc.remove(maillot); maillot.liberer(); }
    maillot = m; sc.add(m);
    if (opts.entree !== false) m.scale.setScalar(.88);
  };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.position.z = distance(cam, 1.22); cam.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas); resize();
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(canvas);
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; moved = 0; vit = 0; cible = null; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    rot += dx * .012; vit = dx * .012;
  });
  const fin = () => {
    if (!drag) return; drag = false;
    if (moved < 6) { cible = Math.round(rot / Math.PI) * Math.PI + Math.PI; opts.onTap && opts.onTap(); }
  };
  canvas.addEventListener('pointerup', fin); canvas.addEventListener('pointercancel', fin);
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(.05, clock.getDelta());
    if (!visible || !maillot) return;
    if (cible !== null) { rot += (cible - rot) * Math.min(1, dt * 7); if (Math.abs(cible - rot) < .002) { rot = cible; cible = null; } }
    else if (!drag) { rot += vit; vit *= .94; if (auto && Math.abs(vit) < .002) rot += dt * .45; }
    maillot.rotation.y = rot;
    maillot.position.y = Math.sin(clock.elapsedTime * 1.4) * .03;
    if (maillot.scale.x < 1) maillot.scale.setScalar(Math.min(1, maillot.scale.x + dt * 1.5));
    renderer.render(sc, cam);
  });
  return {
    set,
    montrerDos: () => { cible = Math.ceil(rot / (2 * Math.PI)) * 2 * Math.PI + Math.PI; },
    montrerFace: () => { cible = Math.round(rot / (2 * Math.PI)) * 2 * Math.PI; },
    redessiner: nd => maillot && maillot.redessiner(nd),
    auto: v => { auto = v; },
  };
}

// ---------- Vignettes (image unique, pour le catalogue) ----------
let TH = null;
async function thumb(D, w = 360, h = 420, rot = -.38) {
  await formePrete;
  if (!FORME) return '';
  if (!TH) {
    const c = document.createElement('canvas');
    const renderer = nouveauRendu(c); renderer.setPixelRatio(1);
    TH = { renderer, sc: scene(renderer), cam: new THREE.PerspectiveCamera(30, 1, .1, 50) };
  }
  const { renderer, sc, cam } = TH;
  renderer.setSize(w, h, false); cam.aspect = w / h;
  cam.position.set(0, .05, distance(cam, 1.15)); cam.updateProjectionMatrix();
  const m = creerMaillot({ ...D }); await m.pret; m.rotation.y = rot; sc.add(m);
  renderer.render(sc, cam);
  const url = renderer.domElement.toDataURL('image/webp', .86);
  sc.remove(m); m.liberer();
  return url;
}

window.Jersey3D = { viewer, thumb, render: async (D, w, h, rot) => thumb(D, w, h, rot) };
Promise.all([document.fonts.load('900 40px Archivo'), formePrete]).finally(() => window.dispatchEvent(new Event('jersey3d-ready')));
