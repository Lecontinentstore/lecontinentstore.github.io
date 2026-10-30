// Recherche « intelligente » dans le catalogue : sans accents ni majuscules, tolère les fautes
// (« camerun », « bresile », « maroque »), les noms en anglais et les surnoms des sélections.
(() => {
  const AUTRES_NOMS = {
    'Cameroun': 'camerounais cameroon kamerun lions indomptables cmr 237',
    "Côte d'Ivoire": 'ivoirien cote ivoire ivory coast civ ci elephants rci 225',
    'Cap-Vert': 'capverdien cap vert cape verde cabo verde capvert requins bleus',
    'Togo': 'togolais eperviers tgo 228',
    'Centrafrique': 'centrafricain centrafricaine rca car central africa fauves',
    'Mali': 'malien aigles mli 223',
    'Maroc': 'marocain morocco maroco lions atlas mar 212',
    'Tunisie': 'tunisien tunisia tunis aigles carthage tun 216',
    'Égypte': 'egyptien egypt egypte pharaons misr',
    'Haïti': 'haitien haiti ayiti grenadiers',
    'Brésil': 'bresilien brazil brasil selecao bresil auriverde',
    'Argentine': 'argentin argentina albiceleste messi',
    'Mexique': 'mexicain mexico tri',
    'France': 'francais bleus fff',
    'Portugal': 'portugais selecao portugal cr7 ronaldo',
    'Espagne': 'espagnol spain espana roja',
    'Norvège': 'norvegien norway norge haaland',
    'Japon': 'japonais japan nippon samourai',
  };
  const MOTS = {
    domicile: 'home dom maison', exterieur: 'away ext', special: 'speciale edition', retro: 'vintage ancien 98 1998',
    manches: 'longues ml manche', bebe: 'baby body', enfant: 'kids kid junior',
  };

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  // écriture « au son » : marok = maroc = maroque, bresil = brezil, kamerun = cameroun
  const son = s => s.replace(/ph/g, 'f').replace(/qu|ck|q/g, 'k').replace(/c([aou]|$)/g, 'k$1').replace(/c/g, 's').replace(/z/g, 's')
    .replace(/y/g, 'i').replace(/h/g, '').replace(/ou/g, 'u').replace(/(.)\1+/g, '$1').replace(/(.{3,}?)[estx]+$/, '$1');

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    let p = Array.from({ length: b.length + 1 }, (_, i) => i), pp = p;
    for (let i = 1; i <= a.length; i++) {
      const c = [i];
      for (let j = 1; j <= b.length; j++) {
        c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) c[j] = Math.min(c[j], pp[j - 2] + 1); // lettres inversées
      }
      pp = p; p = c;
    }
    return p[b.length];
  }

  // note d'un mot tapé face à un mot du maillot
  function noteMot(q, m) {
    if (q === m) return 4;
    if (m.startsWith(q) && q.length >= 2) return 3;
    if (q.length >= 3 && m.includes(q)) return 2;
    const sq = son(q), sm = son(m);
    if (sq.length >= 3 && (sq === sm || sm.startsWith(sq))) return 2.5;
    // faute de frappe : même début (au son), une lettre d'écart (deux pour les mots longs)
    if (q.length >= 4 && m.length >= 3 && (q[0] === m[0] || sq[0] === sm[0])) {
      const d = Math.min(lev(q, m.slice(0, q.length + 1)), lev(q, m), sq.length >= 4 && sm.length >= 4 ? lev(sq, sm) : 9);
      if (d <= (q.length >= 8 ? 2 : 1)) return 2 - d * .4;
    }
    return 0;
  }

  const index = new Map();
  const motsDe = p => {
    if (index.has(p)) return index.get(p);
    let t = `${p.pays} ${p.version} ${AUTRES_NOMS[p.pays] || ''} ${(p.tags || []).join(' ')} ${(p.petits || []).join(' ')}`;
    t = norm(t);
    for (const [k, v] of Object.entries(MOTS)) if (t.includes(k)) t += ' ' + v;
    const mots = [...new Set(t.split(' ').filter(Boolean))];
    mots.push(norm(p.pays).replace(/ /g, '')); // « cotedivoire », « capvert »
    index.set(p, mots);
    return mots;
  };

  // renvoie les maillots triés du plus proche au moins proche (tous les mots tapés doivent trouver un écho)
  window.chercherMaillots = (q, liste = window.PRODUITS) => {
    const mots = norm(q).split(' ').filter(m => m && !['de', 'du', 'la', 'le', 'les', 'maillot', 'maillots', 'd', 'l', 'en'].includes(m));
    if (!mots.length) return null;
    const res = [];
    for (const p of liste) {
      const pm = motsDe(p);
      let total = 0;
      for (const q1 of mots) {
        const n = Math.max(0, ...pm.map(m => noteMot(q1, m)), noteMot(mots.join(''), norm(p.pays).replace(/ /g, '')));
        if (!n) { total = 0; break; }
        total += n;
      }
      if (total) res.push([p, total]);
    }
    return res.sort((a, b) => b[1] - a[1]).map(r => r[0]);
  };

  // pour « Tu voulais dire… » : les pays les plus proches de ce qui a été tapé
  window.paysProches = q => {
    const t = norm(q).replace(/ /g, '');
    if (t.length < 2) return [];
    const pays = [...new Set(window.PRODUITS.map(p => p.pays))];
    return pays.map(nm => {
      const cands = [norm(nm).replace(/ /g, ''), ...(AUTRES_NOMS[nm] || '').split(' ')].filter(c => c.length >= 4);
      return [nm, Math.min(...cands.map(c => Math.min(lev(t, c.slice(0, t.length)) + .5, lev(son(t), son(c)))))];
    }).filter(r => r[1] <= Math.max(1, Math.floor(t.length / 4))).sort((a, b) => a[1] - b[1]).slice(0, 3).map(r => r[0]);
  };
})();
