// Globe terrestre de nuit (Three.js) derrière le titre de l'accueil :
// étoiles, atmosphère, rotation au glisser, léger suivi de la souris, et un point lumineux
// sur chaque pays dont on a le maillot. Survol = nom du pays ; clic = carte avec les maillots du pays.
import * as THREE from 'three';

const PAYS = {
  'Cameroun': [7.4, 12.4], "Côte d'Ivoire": [7.5, -5.5], 'Cap-Vert': [16.0, -24.0], 'Togo': [8.6, 0.8],
  'Centrafrique': [6.6, 20.9], 'Mali': [17.6, -4.0], 'Maroc': [31.8, -7.1], 'Tunisie': [34.0, 9.0],
  'Égypte': [26.8, 30.8], 'Haïti': [19.0, -72.3], 'Brésil': [-10.8, -52.9], 'Argentine': [-34.0, -64.0],
  'Mexique': [23.6, -102.5], 'France': [46.6, 2.2], 'Portugal': [39.4, -8.2], 'Espagne': [40.4, -3.7],
  'Norvège': [61.0, 8.5], 'Japon': [36.2, 138.2],
};
const R = 1;
const versXYZ = (lat, lon, r = R) => {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};
const VS = 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 p = modelViewMatrix*vec4(position,1.); v = normalize(-p.xyz); gl_Position = projectionMatrix*p; }';

function demarrer() {
  const canvas = document.getElementById('globe');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  const mobile = matchMedia('(pointer: coarse)').matches;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, 1, .1, 100);

  // étoiles : deux couches qui bougent un peu différemment (profondeur)
  const etoiles = [];
  for (const [n, taille, dist] of [[mobile ? 900 : 1800, .018, 18], [mobile ? 300 : 600, .035, 12]]) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(dist * (.7 + Math.random() * .6));
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: taille, color: 0xffffff, transparent: true, opacity: .85, depthWrite: false }));
    scene.add(pts); etoiles.push(pts);
  }

  // globe
  const pivot = new THREE.Group(); scene.add(pivot);
  const tex = new THREE.TextureLoader().load('img/globe/terre-nuit.webp');
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  pivot.add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshBasicMaterial({ map: tex })));
  // atmosphère : halo doré autour (effet de Fresnel) + bord lumineux fin
  const coul = new THREE.Color('#5b8cff');
  const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 64, 48), new THREE.ShaderMaterial({
    uniforms: { c: { value: coul } }, vertexShader: VS,
    fragmentShader: 'uniform vec3 c; varying vec3 n; varying vec3 v; void main(){ float f = pow(1. - abs(dot(n, v)), 4.); gl_FragColor = vec4(c, f * .55); }',
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const bord = new THREE.Mesh(new THREE.SphereGeometry(R * 1.002, 64, 48), new THREE.ShaderMaterial({
    uniforms: { c: { value: coul } }, vertexShader: VS,
    fragmentShader: 'uniform vec3 c; varying vec3 n; varying vec3 v; void main(){ float f = pow(1. - dot(n, v), 5.); gl_FragColor = vec4(c, f * .45); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(halo, bord);

  // points des pays dont on a des maillots
  const parPays = {};
  (window.PRODUITS || []).forEach(p => { (parPays[p.pays] = parPays[p.pays] || []).push(p); });
  const tache = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const points = [];
  Object.entries(PAYS).forEach(([nom, [lat, lon]]) => {
    if (!parPays[nom]) return;
    const [c1] = window.couleursPays ? window.couleursPays(nom) : ['#e3b54c'];
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tache, color: new THREE.Color(c1).lerp(new THREE.Color('#fff'), .3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(versXYZ(lat, lon, R * 1.01)); s.scale.setScalar(.07);
    s.userData = { nom, base: mobile ? .085 : .07, phase: Math.random() * 6 };
    pivot.add(s); points.push(s);
  });

  // rotation
  let rotY = -((12 + 90) * Math.PI / 180), rotX = .15, vy = 0, cibleY = null, cibleX = null, choisi = null;
  let drag = false, lx = 0, ly = 0, bouge = 0, mx = 0, my = 0;

  // étiquette au survol + carte au clic
  const tip = document.createElement('div'); tip.className = 'globe-tip'; hero.appendChild(tip);
  const carte = document.getElementById('globe-card');
  const photo = p => p.photo ? `img/photos/${p.img}.webp?v=${p.photo}` : `img/detoures/${p.img}.webp`;
  function ouvrirCarte(nom) {
    const liste = parPays[nom] || [];
    if (!liste.length) return;
    window.choisirPays && window.choisirPays(nom);
    const n = liste.length;
    carte.innerHTML = `<button class="gc-close" aria-label="Fermer">×</button>
      <p class="gc-pays">${window.ecussonPays ? window.ecussonPays(nom) : ''} ${nom}</p>
      <p class="gc-n">${n} maillot${n > 1 ? 's' : ''} dispo · 35 €</p>
      <div class="gc-list">${liste.map((p, i) => `<button class="gc-item" data-i="${i}"><img src="${photo(p)}" alt=""><span>${p.version}</span></button>`).join('')}</div>`;
    carte.hidden = false;
    carte.querySelector('.gc-close').onclick = () => { carte.hidden = true; choisi = null; window.choisirPays && window.choisirPays(null); };
    carte.querySelectorAll('.gc-item').forEach(b => { b.onclick = () => window.ouvrirProduit && window.ouvrirProduit(liste[+b.dataset.i]); });
    viser(nom);
    finDemo();
  }
  // tourne le globe pour mettre le pays face à nous
  function viser(nom, decale = false) {
    const [lat, lon] = PAYS[nom];
    cibleY = -((lon + 90) * Math.PI / 180) + (decale ? .62 : 0); cibleX = lat * Math.PI / 180 * .6 + (decale ? .3 : 0);
    while (cibleY - rotY > Math.PI) cibleY -= 2 * Math.PI;
    while (rotY - cibleY > Math.PI) cibleY += 2 * Math.PI;
    // démo : toujours dans le sens où la Terre tourne déjà, jamais de retour en arrière
    if (decale) while (cibleY <= rotY) cibleY += 2 * Math.PI;
    choisi = nom;
  }

  // démo d'accueil : à l'arrivée, le globe se pose sur un pays, l'allume et montre ses maillots en vignette
  // (pour faire comprendre qu'on peut toucher les pays), puis passe au suivant, jusqu'au premier geste du visiteur
  // d'est en ouest, dans le sens de rotation : on fait le tour du monde sans jamais revenir en arrière
  const DEMO = ['Cameroun', "Côte d'Ivoire", 'Cap-Vert', 'Brésil', 'Argentine', 'Mexique', 'Japon', 'Égypte'].filter(n => parPays[n]);
  const pin = document.createElement('button'); pin.className = 'globe-pin'; pin.type = 'button'; hero.appendChild(pin);
  let demoOn = true, demoI = -1, demoT = 0, pinNom = null;
  function etapeDemo() {
    demoI = (demoI + 1) % DEMO.length;
    const nom = DEMO[demoI], l = parPays[nom];
    viser(nom, true); pinNom = nom;
    window.choisirPays && window.choisirPays(nom);
    pin.innerHTML = `${window.ecussonPays ? window.ecussonPays(nom) : ''}${nom}`;
    pin.classList.remove('on'); void pin.offsetWidth; pin.classList.add('on');
  }
  function finDemo() {
    if (!demoOn) return;
    demoOn = false; pin.classList.remove('on'); pinNom = null;
  }
  pin.addEventListener('click', () => { const n = pinNom; finDemo(); if (n) ouvrirCarte(n); });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmp = new THREE.Vector3();
  const survol = e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    // seuls les points sur la face visible comptent ; zone de clic agrandie
    let best = null, bd = .06;
    for (const p of points) {
      p.getWorldPosition(tmp);
      if (tmp.clone().sub(pivot.position).dot(cam.position.clone().sub(tmp)) < 0) continue;
      const d = ray.ray.distanceToPoint(tmp);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
  canvas.addEventListener('pointerdown', e => { if (demoOn) { finDemo(); window.choisirPays && window.choisirPays(null); choisi = null; } drag = true; bouge = 0; lx = e.clientX; ly = e.clientY; cibleY = cibleX = null; });
  addEventListener('pointerup', e => {
    if (drag && bouge < 8) { const p = survol(e); if (p) ouvrirCarte(p.userData.nom); }
    drag = false;
  });
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    if (drag) {
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; bouge += Math.abs(dx) + Math.abs(dy);
      vy = dx * .005; rotY += vy; rotX = Math.max(-.6, Math.min(.8, rotX + dy * .003));
    }
    if (e.target !== canvas) { tip.style.opacity = 0; return; }
    const p = survol(e);
    canvas.style.cursor = p ? 'pointer' : (drag ? 'grabbing' : 'grab');
    if (p) {
      const l = parPays[p.userData.nom];
      tip.innerHTML = `${window.ecussonPays ? window.ecussonPays(p.userData.nom) : ''} ${p.userData.nom} · ${l.length} maillot${l.length > 1 ? 's' : ''}`;
      const r = hero.getBoundingClientRect();
      tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top - 10}px)`; tip.style.opacity = 1;
    } else tip.style.opacity = 0;
  });

  // taille (globe un peu sous le centre, derrière le titre)
  const taille = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.position.set(0, 0, w < 700 ? 4.8 : 4.0); cam.updateProjectionMatrix();
  };
  addEventListener('resize', taille); taille();

  // défilement : le globe grossit et s'estompe quand on quitte l'accueil
  let prog = 0;
  addEventListener('scroll', () => { prog = Math.min(1, Math.max(0, scrollY / (hero.clientHeight * .9))); }, { passive: true });

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  let t0 = performance.now(); const debut = t0;
  (function boucle(t) {
    requestAnimationFrame(boucle);
    const dt = Math.min(.05, (t - t0) / 1000); t0 = t;
    if (!visible) return;
    // pendant la démo d'arrivée, la Terre continue de tourner doucement, le pays choisi glisse avec elle
    if (demoOn && cibleY !== null && !calme) cibleY += dt * .05;
    if (cibleY !== null) { const v = Math.min(1, dt * (demoOn ? 1.3 : 3)); rotY += (cibleY - rotY) * v; rotX += (cibleX - rotX) * v; }
    else if (!drag) { rotY += vy; vy *= .95; if (!calme && !choisi && Math.abs(vy) < .001) rotY += dt * .06; }
    // ouverture : on arrive de loin dans les étoiles, le globe grossit et tourne vers nous
    const k = calme ? 1 : Math.min(1, (t - debut) / 2600), e = 1 - Math.pow(1 - k, 3);
    const zBase = hero.clientWidth < 700 ? 4.8 : 4.0;
    cam.position.z = zBase + (1 - e) * 14;
    if (k < 1) { canvas.style.opacity = e; for (const s of etoiles) s.material.opacity = .85 * Math.min(1, k * 2.5); }
    pivot.rotation.set(rotX + my * .12, rotY + mx * .25 - (1 - e) * 2.2, 0);
    pivot.position.set(0, -.25 - prog * .5, prog * .5); pivot.scale.setScalar(1 + prog * .35);
    halo.position.copy(pivot.position); halo.scale.copy(pivot.scale); bord.position.copy(pivot.position); bord.scale.copy(pivot.scale);
    if (k >= 1) canvas.style.opacity = 1 - prog * .85;
    etoiles[0].rotation.set(my * .02, t * .000006 + mx * .03, 0);
    etoiles[1].rotation.set(my * .05, t * .00001 + mx * .06, 0);
    if (demoOn && k >= 1 && !calme) {
      if (demoI < 0 || t - demoT > 5200) { demoT = t; etapeDemo(); }
      const pt = points.find(q => q.userData.nom === pinNom);
      if (pt) {
        const v = pt.getWorldPosition(new THREE.Vector3()).project(cam);
        const r = canvas.getBoundingClientRect();
        // petite étiquette (écusson + nom) collée au point du pays, comme au survol ;
        // si elle tombe sur le texte ou les boutons, on la pousse sur le côté
        let x = (v.x + 1) / 2 * r.width + 14, y = (1 - v.y) / 2 * r.height - pin.offsetHeight / 2;
        const w = pin.offsetWidth, h = pin.offsetHeight;
        const blocs = [...hero.querySelectorAll('.hero-title, .hero-sub, .hero-cta-c, .kicker')].map(el => el.getBoundingClientRect());
        for (const e of blocs) {
          const l = e.left - r.left - 10, d = e.right - r.left + 10, t = e.top - r.top - 6, bas = e.bottom - r.top + 6;
          if (x < d && x + w > l && y < bas && y + h > t) {
            if (d + w + 8 <= r.width) x = d; else if (l - w >= 8) x = l - w;
            else { y = Math.max(...blocs.map(b => b.bottom)) - r.top + 14; break; } // pas de place à côté : sous les boutons
          }
        }
        pin.style.transform = `translate(${Math.max(8, Math.min(r.width - w - 8, x))}px, ${y}px)`;
      }
    }
    for (const p of points) p.scale.setScalar(p.userData.base * (p.userData.nom === choisi ? 1.9 : 1 + Math.sin(t * .003 + p.userData.phase) * .25));
    renderer.render(scene, cam);
  })(t0);
}

if (window.PRODUITS && window.couleursPays) demarrer();
else addEventListener('load', demarrer, { once: true });
