// Flocage sur la photo du dos (img/dos/<img>.webp), comme sur les boutiques officielles :
// tailles de pro (nom ~7 cm, numéro ~25 cm pour un dos de ~52 cm), police officielle du pays ou du club,
// couleurs du flocage officiel, plis du tissu visibles à travers.
(() => {
  // polices officielles de flocage (pack de Patrick, dans polices/<clé>.woff2) : f = nom interne, fichier = clé
  // acc : on garde les accents (police qui les a, et équipe qui les imprime : la France imprime « MBAPPE » sans accent)
  const OFF = {
    france: 0, 'france-ext': 0, bresil: 0, argentine: 0, adidas26: 0, 'adidas26-ext': 0, espagne: 0, portugal: 1, norvege: 0,
    allemagne: 1, angleterre: 0, coree: 0, puma26: 0, egypte: 1, mali: 1, haiti: 1, togo: 0, cameroun: 1, nike24: 0,
    real: 1, psg: 1, arsenal: 1, om: 1, liverpool: 0, bayern: 0, barca: 1, 'barca-ext': 1, 'man-united': 0, 'man-city': 1, ligue1: 0, santos: 0,
  };
  const POLICES = Object.fromEntries(Object.entries(OFF).map(([k, acc]) => [k, { f: 'Floc ' + k, w: 400, fichier: k, acc: !!acc }]));
  // pas de police officielle dans le pack : la plus proche sur Google Fonts
  Object.assign(POLICES, {
    kappa: { f: 'Oswald', w: 700, acc: true },                      // Tunisie
    retro98: { f: 'Russo One', w: 400, acc: true },                  // France 98 : gros, rond, contour (Zidane 10)
    classique: { f: 'Oswald', w: 600, acc: true },                   // Cap-Vert, Centrafrique, RDC, Bénin, Gabon, Palestine…
  });
  const PAYS_POLICE = {
    'France': 'france', 'Brésil': 'bresil', 'Argentine': 'argentine', 'Mexique': 'adidas26', 'Japon': 'adidas26', 'Belgique': 'adidas26', 'Algérie': 'adidas26',
    'Espagne': 'espagne', 'Portugal': 'portugal', 'Norvège': 'norvege', 'Allemagne': 'allemagne', 'Angleterre': 'angleterre', 'Corée du Sud': 'coree',
    'Maroc': 'puma26', "Côte d'Ivoire": 'puma26', 'Sénégal': 'puma26', 'Égypte': 'egypte', 'Mali': 'mali', 'Haïti': 'haiti', 'Togo': 'togo',
    'Cameroun': 'cameroun', 'Nigeria': 'nike24', 'Tunisie': 'kappa',
    'Real Madrid': 'real', 'PSG': 'psg', 'Arsenal': 'arsenal', 'Marseille': 'om', 'Liverpool': 'liverpool', 'Bayern Munich': 'bayern',
    'Barça': 'barca', 'Manchester United': 'man-united', 'Manchester City': 'man-city', 'Lyon': 'ligue1', 'Paris FC': 'ligue1', 'Santos': 'santos',
  };
  // police de la tenue extérieure quand elle diffère de celle du domicile
  const EXT = { france: 'france-ext', adidas26: 'adidas26-ext', barca: 'barca-ext' };
  const marque = p => {
    if (/1998/.test(p.img)) return 'retro98';
    const m = PAYS_POLICE[p.pays] || 'classique';
    return /exterieur/.test(p.img) && EXT[m] ? EXT[m] : m;
  };
  window.policeFlocage = p => POLICES[marque(p)];

  // place et taille du flocage, mesurées sur de vrais maillots de match floqués (photos de dos, 2024-2026),
  // en % de la hauteur du maillot (col -> bas) : [début du nom, hauteur du nom, début du numéro, hauteur du numéro]
  const PROP = {
    argentine: [14, 8.5, 27.5, 28],     // Messi 10
    espagne: [15.5, 7.5, 28, 34],       // Lamine Yamal 19
    france: [14, 6, 24, 30.5], 'france-ext': [14, 6, 24, 30.5],   // Mbappé 10
    psg: [11, 6.5, 20.5, 31],           // O. Dembélé 10
    cameroun: [13.5, 7, 25.5, 32.5],    // Mbeumo 20
    puma26: [11, 7, 23, 36],            // Hakimi 2 (Maroc ; même équipementier pour la Côte d'Ivoire et le Sénégal)
    bresil: [12.5, 7.5, 24.5, 34.5],    // Vini Jr 7
    real: [14.5, 8, 27, 36],            // Mbappé 10
    barca: [15.5, 6.5, 30.5, 29], 'barca-ext': [15.5, 6.5, 30.5, 29],   // Lamine Yamal 10
  };
  const MOYENNE = [13.5, 7.2, 25.5, 32];

  // couleurs vues sur les flocages officiels [remplissage, contour] ; sinon contraste avec le tissu
  const COULEURS = {
    'domicile-bresil': ['#0a9a4a', '#0b2a6b'], 'exterieur-bresil': ['#ffd400', null],
    'domicile-argentine': ['#111111', null], 'exterieur-argentine': ['#ffffff', null],
    'domicile-espagne': ['#f6c400', null], 'exterieur-espagne': ['#c8102e', null],
    'exterieur-france': ['#a8714a', null], 'exterieur-france-manche-longue': ['#a8714a', null],
    'domicile-france-manche-longue': ['#ffffff', null], 'france-x-jacquemus': ['#ffffff', null],
    'france-domicile-1998-retro-zidane': ['#ffffff', '#d4001f'], 'france-1998-retro-exterieur-zidane': ['#1c3f94', '#d4001f'],
    'exterieur-portugal': ['#111111', null], 'domicile-mexique': ['#ffffff', null],
    'domicile-cote-divoire': ['#ffffff', '#00965e'], 'exterieur-cote-divoire': ['#f47a20', null],
    'haiti-domicile': ['#ffffff', null], 'haiti-exterieur': ['#00209f', null],
    'japon-edition-manga': ['#0a2a6b', '#ffffff'], 'domicile-maroc': ['#ffffff', null], 'exterieur-maroc': ['#b8001f', null],
    'domicile-tunisie': ['#ffffff', null], 'exterieur-tunisie': ['#e70013', null],
    'domicile-egypte': ['#ffffff', null], 'exterieur-egypte': ['#111111', null],
    'cameroun-exterieur-rouge-2025': ['#ffd400', null], 'domicile-cameroun-2026': ['#ffd400', null],
    'exterieur-cameroun': ['#0a7a3e', null], 'cameroun-black-2026': ['#f2b705', null], 'cameroun-edition-rose': ['#141014', null],
    'real-madrid-domicile-2026': ['#1d2a44', null], 'real-madrid-exterieur-2026': ['#e8d9a8', null], 'real-madrid-rose-2026': ['#ffffff', null],
    'psg-domicile-2026': ['#ffffff', null], 'psg-exterieur-2026': ['#0b1f4a', null], 'arsenal-domicile-2026': ['#ffffff', null], 'arsenal-exterieur-2026': ['#f2c230', null],
    'om-domicile-2026': ['#0b2a5b', null], 'om-exterieur-2026': ['#ffffff', null], 'liverpool-domicile-2026': ['#ffffff', null], 'liverpool-exterieur-2026': ['#b5121b', null],
    'bayern-domicile-2026': ['#ffffff', null], 'bayern-exterieur-2026': ['#c8102e', null], 'barca-domicile-2026': ['#f6c400', null], 'barca-exterieur-2026': ['#d9b24c', null],
    'man-united-domicile-2026': ['#ffffff', null], 'man-united-exterieur-2026': ['#ffffff', null], 'man-city-domicile-2026': ['#1c2c5b', null], 'man-city-exterieur-2026': ['#d9b24c', null],
    'lyon-domicile-2026': ['#14387f', null], 'lyon-exterieur-2026': ['#ffffff', null], 'paris-fc-domicile-2026': ['#ffffff', null], 'paris-fc-exterieur-2026': ['#0b1f4a', null],
    'santos-neymar-2026': ['#111111', null],
    'domicile-mali': ['#ffd400', null], 'domicile-togo': ['#0a7a3e', null], 'togo-vert': ['#ffd400', null], 'togo-blanc': ['#0a7a3e', null],
  };

  // réglages au cas par cas : dy = décalage vers le bas (part de la hauteur du maillot), t = taille
  const AJUST = {
    'france-domicile-1998-retro-zidane': { dy: .05 }, 'france-1998-retro-exterieur-zidane': { dy: .05 },
    'domicile-france-manche-longue': { dy: .03 },
  };

  let REP = null;
  const pret = fetch('img/dos/reperes.json?v=14').then(r => r.json()).then(j => { REP = j; }).catch(() => { REP = {}; });
  window.dosFlocage = pret.then(() => REP);   // maillots qui ont une photo de dos (donc floquables à l'écran)
  const images = new Map();
  const charger = src => {
    if (!images.has(src)) images.set(src, new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; }));
    return images.get(src);
  };
  // police officielle : fichier du site ; sinon la feuille Google Fonts, chargée AVANT de demander la police
  const polices = new Map();
  const police = m => {
    const P = POLICES[m];
    if (!polices.has(P.f)) polices.set(P.f, (P.fichier
      ? new FontFace(P.f, `url(polices/${P.fichier}.woff2?v=2)`).load().then(ff => { document.fonts.add(ff); })
      : new Promise(ok => {
        const l = document.createElement('link'); l.rel = 'stylesheet';
        l.href = `https://fonts.googleapis.com/css2?family=${P.f.replace(/ /g, '+')}:wght@${P.w}&display=block`;
        l.onload = l.onerror = ok; document.head.appendChild(l);
      }).then(() => document.fonts.load(`${P.w} 80px "${P.f}"`, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'))).catch(() => {}));
    return polices.get(P.f);
  };
  window.chargerPoliceFlocage = p => police(marque(p));
  const clair = (r, g, b) => (r * 299 + g * 587 + b * 114) / 1000 > 150;

  // dessine ; renvoie false s'il n'y a pas de photo du dos pour ce maillot
  window.flocagePhoto = async (c, p, nom, num) => {
    await pret;
    const R = REP[p.img];
    if (!R) return false;
    const m = marque(p), P = POLICES[m];
    const [ph] = await Promise.all([charger(`img/dos/${p.img}.webp?v=8`), police(m)]);
    const S = 900, r = Math.min(2, devicePixelRatio || 1);
    c.width = S * r; c.height = S * r;
    const x = c.getContext('2d'); x.setTransform(r, 0, 0, r, 0, 0); x.clearRect(0, 0, S, S);
    x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 40; x.shadowOffsetY = 20; x.drawImage(ph, 0, 0, S, S); x.restore();

    // proportions d'un dos de pro, rapportées à la largeur du dos sur la photo
    const L = R.larg, cx = R.cx;
    // tailles des maillots de match de l'équipe (PROP), en part de la hauteur du maillot (col -> bas)
    const Hm = R.bas - R.haut, [n0, nh, u0, uh] = (PROP[m] || MOYENNE).map(v => v / 100);
    const A = AJUST[p.img] || {}, dy = (A.dy || 0) * Hm, tl = A.t || 1;
    const hNom = Hm * nh * tl, yNom = R.haut + Hm * n0 + dy;
    const hNum = Hm * uh * tl, yNum = R.haut + Hm * u0 + dy;

    // couleur : officielle, sinon contraste avec le tissu sous le numéro
    let [fill, liser] = COULEURS[p.img] || [];
    if (!fill) {
      const t = document.createElement('canvas'); t.width = t.height = 1;
      const tx = t.getContext('2d'); tx.drawImage(ph, cx - L * .2, yNum + hNum * .3, L * .4, hNum * .4, 0, 0, 1, 1);
      const [a, b, d] = tx.getImageData(0, 0, 1, 1).data;
      fill = p.txt || (clair(a, b, d) ? '#141414' : '#ffffff');
    }

    // maillot en 3/4 : la photo reste telle quelle, c'est le flocage qu'on met en perspective (plus étroit, plus petit
    // du côté qui s'éloigne), posé sur l'axe du milieu du dos (R.axe, repéré sur la photo) et penché comme le maillot (R.rot).
    // Maillot de face : flocage à plat, centré. phi = rotation (dos_angle.py), F = centre du texte à plat
    const demi = R.demi || L / 2, phi = Math.abs(R.angle || 0) < 4 ? 0 : (R.angle || 0) * Math.PI / 180, F = S / 2;
    const axe = R.axe, cxA = yy => axe ? axe[0] + (axe[2] - axe[0]) * (yy - axe[1]) / (axe[3] - axe[1]) : cx;
    const plat = document.createElement('canvas'); plat.width = plat.height = S;
    const t = plat.getContext('2d');
    t.textAlign = 'center'; t.textBaseline = 'alphabetic'; t.fillStyle = fill;
    const ecrire = (txt, hc, y, sx, esp) => {
      t.font = `${P.w} 100px "${P.f}", Archivo, sans-serif`;
      const hm = t.measureText(/^\d+$/.test(txt) ? '0' : 'H').actualBoundingBoxAscent || 72;   // hauteur des capitales pour 100 px
      const h = hc * 100 / hm;
      t.font = `${P.w} ${h}px "${P.f}", Archivo, sans-serif`;
      t.letterSpacing = `${esp}px`;
      let s = sx; const max = L * .86;
      const w = t.measureText(txt).width * s;
      if (w > max) s *= max / w;
      t.save(); t.translate(F, y); t.scale(s, 1);
      if (liser) { t.lineWidth = h * .06; t.strokeStyle = liser; t.lineJoin = 'round'; t.strokeText(txt, 0, 0); }
      t.fillText(txt, 0, 0); t.restore();
    };
    // hauteur de capitale ≈ 0,72 × taille de police
    const nomF = P.acc ? nom : nom.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (nomF) ecrire(nomF, hNom, yNom + hNom, P.nom || 1, hNom * .06);
    ecrire(num, hNum, yNum + hNum, P.num || 1, hNum * .02);
    // 1. perspective : chaque colonne du texte à plat est resserrée (cos phi) et rapetisse en s'éloignant
    const yc = (yNom + yNum + hNum) / 2;
    let src = plat;
    if (phi) {
      src = document.createElement('canvas'); src.width = src.height = S;
      const sc = src.getContext('2d'), co = Math.cos(phi), fuite = .25 * Math.sin(phi) / demi;
      for (let xf = 0; xf < S; xf++) {
        const hs = 1 - fuite * (xf - F);
        sc.drawImage(plat, xf, 0, 1, S, F + (xf - F) * co, yc - yc * hs, co + .35, S * hs);
      }
    }
    // 2. pose sur le dos : centré sur l'axe, qui peut pencher (cisaillement), et tourné comme le maillot
    const k = document.createElement('canvas'); k.width = k.height = S;
    const kc = k.getContext('2d');
    kc.save(); kc.translate(cxA(yc), yc); kc.rotate((R.rot || 0) * Math.PI / 180);
    if (axe) kc.transform(1, 0, (axe[2] - axe[0]) / (axe[3] - axe[1]), 1, 0, 0);
    kc.drawImage(src, -F, -yc); kc.restore();
    const t2 = kc;
    // plis et grain du tissu : la photo en niveaux de gris, en incrustation sur les lettres seulement
    const masque = document.createElement('canvas'); masque.width = masque.height = S;
    masque.getContext('2d').drawImage(k, 0, 0);
    t2.globalCompositeOperation = 'overlay'; t2.globalAlpha = .35;
    t2.filter = 'grayscale(1) contrast(1.6) brightness(1.05)';
    t2.drawImage(ph, 0, 0, S, S);
    t2.filter = 'none'; t2.globalAlpha = 1; t2.globalCompositeOperation = 'destination-in';
    t2.drawImage(masque, 0, 0);
    t2.drawImage(ph, 0, 0, S, S);   // et seulement là où il y a du maillot
    x.drawImage(k, 0, 0);
    return true;
  };
})();
