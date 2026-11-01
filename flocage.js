// Flocage sur la vraie photo du dos (img/dos/<img>.webp), comme sur les boutiques officielles :
// tailles de pro (nom ~7 cm, numéro ~25 cm pour un dos de ~52 cm), police de l'équipementier,
// couleurs du flocage officiel, plis du tissu visibles à travers.
(() => {
  // police la plus proche du flocage officiel, choisie en regardant de vrais maillots floqués (Google Fonts)
  // nom / num : largeur relative des lettres ; liseré : épaisseur du contour quand le flocage officiel en a un
  const POLICES = {
    nike24: { f: 'Saira Extra Condensed', w: 600, nom: .9, num: .82 },          // France 2024 : fin et très étroit (Dembélé, Olise)
    bresil: { f: 'Barlow Condensed', w: 700, nom: .9, num: .9 },                // Brésil 2024 : arrondi, contour fin
    argentine: { f: 'Big Shoulders Display', w: 800, nom: .95, num: .95 },     // Argentine : très haut et serré (Messi 10)
    adidas: { f: 'Teko', w: 600, nom: .95, num: 1 },                            // Espagne, Mexique, Japon : carré, étroit
    portugal: { f: 'Rajdhani', w: 700, nom: .9, num: .95 },                     // Portugal 2025 : anguleux (Ronaldo 7)
    puma: { f: 'Barlow Semi Condensed', w: 700, nom: .88, num: .95 },          // Puma Afrique : arrondi, plus large (Adingra, Salah)
    kappa: { f: 'Oswald', w: 700, nom: .85, num: .92 },                         // Tunisie
    retro98: { f: 'Russo One', w: 400, nom: .9, num: .95 },                     // France 98 : gros, rond, contour (Zidane 10)
    classique: { f: 'Oswald', w: 600, nom: .85, num: .9 },                      // Cameroun, Cap-Vert, Centrafrique, Mali, Haïti…
  };
  const PAYS_POLICE = {
    'France': 'nike24', 'Norvège': 'nike24', 'Brésil': 'bresil', 'Argentine': 'argentine',
    'Espagne': 'adidas', 'Mexique': 'adidas', 'Japon': 'adidas', 'Portugal': 'portugal',
    'Maroc': 'puma', "Côte d'Ivoire": 'puma', 'Égypte': 'puma', 'Togo': 'puma', 'Tunisie': 'kappa',
  };
  const marque = p => /1998/.test(p.img) ? 'retro98' : (PAYS_POLICE[p.pays] || 'classique');

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
    'domicile-mali': ['#ffd400', null], 'domicile-togo': ['#0a7a3e', null], 'togo-vert': ['#ffd400', null], 'togo-blanc': ['#0a7a3e', null],
  };

  // réglages au cas par cas : dy = décalage vers le bas (part de la hauteur du maillot), t = taille
  const AJUST = {
    'france-domicile-1998-retro-zidane': { dy: .05 }, 'france-1998-retro-exterieur-zidane': { dy: .05 },
    'domicile-france-manche-longue': { dy: .03 },
  };

  let REP = null;
  const pret = fetch('img/dos/reperes.json?v=3').then(r => r.json()).then(j => { REP = j; }).catch(() => { REP = {}; });
  const images = new Map();
  const charger = src => {
    if (!images.has(src)) images.set(src, new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; }));
    return images.get(src);
  };
  // la feuille Google Fonts doit être chargée AVANT de demander la police, sinon on dessine avec la police de secours
  const polices = new Map();
  const police = m => {
    const P = POLICES[m];
    if (!polices.has(P.f)) polices.set(P.f, new Promise(ok => {
      const l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = `https://fonts.googleapis.com/css2?family=${P.f.replace(/ /g, '+')}:wght@${P.w}&display=block`;
      l.onload = l.onerror = ok; document.head.appendChild(l);
    }).then(() => document.fonts.load(`${P.w} 80px "${P.f}"`, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')).catch(() => {}));
    return polices.get(P.f);
  };
  const clair = (r, g, b) => (r * 299 + g * 587 + b * 114) / 1000 > 150;

  // dessine ; renvoie false s'il n'y a pas de photo du dos pour ce maillot
  window.flocagePhoto = async (c, p, nom, num) => {
    await pret;
    const R = REP[p.img];
    if (!R) return false;
    const m = marque(p), P = POLICES[m];
    const [ph] = await Promise.all([charger(`img/dos/${p.img}.webp?v=2`), police(m)]);
    const S = 900, r = Math.min(2, devicePixelRatio || 1);
    c.width = S * r; c.height = S * r;
    const x = c.getContext('2d'); x.setTransform(r, 0, 0, r, 0, 0); x.clearRect(0, 0, S, S);
    x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 40; x.shadowOffsetY = 20; x.drawImage(ph, 0, 0, S, S); x.restore();

    // proportions d'un dos de pro, rapportées à la largeur du dos sur la photo
    const L = R.larg, cx = R.cx;
    // mesuré sur des dos officiels (ex. Musiala 14), en part de la hauteur du maillot (col -> bas) :
    // nom de 6,5 % commençant à 16 % sous le col, numéro de 24 % commençant à 28 %
    const Hm = R.bas - R.haut;
    const A = AJUST[p.img] || {}, dy = (A.dy || 0) * Hm, tl = A.t || 1;
    const hNom = Hm * .065 * tl, yNom = R.haut + Hm * .16 + dy;
    const hNum = Hm * .24 * tl, yNum = R.haut + Hm * .28 + dy;

    // couleur : officielle, sinon contraste avec le tissu sous le numéro
    let [fill, liser] = COULEURS[p.img] || [];
    if (!fill) {
      const t = document.createElement('canvas'); t.width = t.height = 1;
      const tx = t.getContext('2d'); tx.drawImage(ph, cx - L * .2, yNum + hNum * .3, L * .4, hNum * .4, 0, 0, 1, 1);
      const [a, b, d] = tx.getImageData(0, 0, 1, 1).data;
      fill = p.txt || (clair(a, b, d) ? '#141414' : '#ffffff');
    }

    // texte sur un calque, puis les plis du tissu par-dessus (effet imprimé)
    const k = document.createElement('canvas'); k.width = k.height = S;
    const t = k.getContext('2d');
    t.textAlign = 'center'; t.textBaseline = 'alphabetic'; t.fillStyle = fill;
    const ecrire = (txt, h, y, sx, esp) => {
      t.font = `${P.w} ${h}px "${P.f}", Archivo, sans-serif`;
      t.letterSpacing = `${esp}px`;
      let s = sx; const max = L * .86;
      const w = t.measureText(txt).width * s;
      if (w > max) s *= max / w;
      t.save(); t.translate(cx, y); t.scale(s, 1);
      if (liser) { t.lineWidth = h * .06; t.strokeStyle = liser; t.lineJoin = 'round'; t.strokeText(txt, 0, 0); }
      t.fillText(txt, 0, 0); t.restore();
    };
    // hauteur de capitale ≈ 0,72 × taille de police
    if (nom) ecrire(nom, hNom / .72, yNom + hNom, P.nom, hNom * .06);
    ecrire(num, hNum / .72, yNum + hNum, P.num, hNum * .02);
    // plis et grain du tissu : la photo en niveaux de gris, en incrustation sur les lettres seulement
    const masque = document.createElement('canvas'); masque.width = masque.height = S;
    masque.getContext('2d').drawImage(k, 0, 0);
    t.globalCompositeOperation = 'overlay'; t.globalAlpha = .35;
    t.filter = 'grayscale(1) contrast(1.6) brightness(1.05)';
    t.drawImage(ph, 0, 0, S, S);
    t.filter = 'none'; t.globalAlpha = 1; t.globalCompositeOperation = 'destination-in';
    t.drawImage(masque, 0, 0);
    t.drawImage(ph, 0, 0, S, S);   // et seulement là où il y a du maillot
    x.drawImage(k, 0, 0);
    return true;
  };
})();
