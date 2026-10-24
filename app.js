(() => {
  const WA = '33751221206';
  const PRIX = 35, FLOC = 15;
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const waLink = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const fin = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!window.gsap;

  // Couleurs officielles par pays : [principale, secondaire, accent] + code à 3 lettres
  const COULEURS = {
    'Cameroun': ['#007a5e', '#ce1126', '#fcd116'], "Côte d'Ivoire": ['#f77f00', '#009e60', '#ffffff'],
    'Cap-Vert': ['#003893', '#cf2027', '#f7d116'], 'Togo': ['#006a4e', '#d21034', '#ffce00'],
    'Centrafrique': ['#003082', '#289728', '#ffce00'], 'Mali': ['#14b53a', '#ce1126', '#fcd116'],
    'Sénégal': ['#00853f', '#e31b23', '#fdef42'], 'Maroc': ['#c1272d', '#006233', '#c1272d'],
    'Tunisie': ['#e70013', '#ffffff', '#e70013'], 'Égypte': ['#ce1126', '#111111', '#c09300'],
    'Haïti': ['#00209f', '#d21034', '#ffffff'], 'Brésil': ['#009c3b', '#002776', '#ffdf00'],
    'Argentine': ['#74acdf', '#ffffff', '#f6b40e'], 'Mexique': ['#006847', '#ce1126', '#ffffff'],
    'France': ['#002395', '#ed2939', '#ffffff'], 'Portugal': ['#006600', '#ff0000', '#ffcc00'],
    'Espagne': ['#aa151b', '#f1bf00', '#aa151b'], 'Norvège': ['#ba0c2f', '#00205b', '#ffffff'],
    'Japon': ['#bc002d', '#ffffff', '#1d2b6b'],
  };
  const CODES = { 'Cameroun': 'CMR', "Côte d'Ivoire": 'CIV', 'Cap-Vert': 'CPV', 'Togo': 'TOG', 'Centrafrique': 'CAF', 'Mali': 'MLI', 'Sénégal': 'SEN', 'Maroc': 'MAR', 'Tunisie': 'TUN', 'Égypte': 'EGY', 'Haïti': 'HAI', 'Brésil': 'BRA', 'Argentine': 'ARG', 'Mexique': 'MEX', 'France': 'FRA', 'Portugal': 'POR', 'Espagne': 'ESP', 'Norvège': 'NOR', 'Japon': 'JPN' };
  const coul = p => COULEURS[p] || ['#e3b54c', '#7a5a14', '#ffffff'];
  const theme = pays => { const [a, b, c] = coul(pays); root.style.setProperty('--c1', a); root.style.setProperty('--c2', b); root.style.setProperty('--c3', c); };
  const img = p => p.photo ? `img/photos/${p.img}.webp?v=${p.photo}` : `img/detoures/${p.img}.webp`;
  const vid = p => `video/${p.img}.mp4`;
  const fallback = e => { const i = e.target; if (!i.dataset.fb) { i.dataset.fb = 1; i.src = i.src.replace('/detoures/', '/maillots/'); } };
  // Description du modèle 3D d'un maillot : vraies photos face/dos + couleurs
  const design = (p, extra = {}) => {
    const [c1, c2, c3] = coul(p.pays);
    return { id: p.img, base: p.base || c1, c1, c2, c3, code: CODES[p.pays] || '', photoFace: `img/3d/${p.img}-face.webp`, photoDos: `img/3d/${p.img}-dos.webp`, ...(p.patron ? { atlas: `img/patron/${p.img}.webp?v=${p.patron}`, txt: p.txt } : {}), ...extra };
  };

  $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });
  $('#year').textContent = new Date().getFullYear();

  // ---------- Défilement fluide (ordinateur seulement : sur téléphone, le défilement natif est plus fluide) ----------
  let lenis = null;
  if (window.Lenis && !calme && fin) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = a.getAttribute('href'); if (t.length < 2 || !$(t)) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -50 }) : $(t).scrollIntoView({ behavior: calme ? 'auto' : 'smooth' });
  }));
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // ---------- En-tête ----------
  const top = $('#top');
  const onScroll = () => { top.classList.toggle('is-solid', scrollY > 40); top.classList.toggle('montre-cmd', scrollY > innerHeight * .6); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- Bandeau ----------
  // écusson de la fédération à la place de l'emoji drapeau
  const slugPays = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/'/g, '').replace(/ /g, '-');
  const ECUSSONS = ['cameroun', 'cote-divoire', 'cap-vert', 'togo', 'centrafrique', 'mali', 'maroc', 'tunisie', 'egypte', 'haiti', 'bresil', 'argentine', 'mexique', 'france', 'portugal', 'espagne', 'norvege', 'japon'];
  const ecu = (n, cl = 'ecu') => `<img class="${cl}" src="img/ecussons/${slugPays(n)}.png" alt="" onerror="this.remove()">`;
  window.ecussonPays = ecu;
  const pays = [...new Map(PRODUITS.map(p => [p.pays, p.drapeau])).entries()];
  const band = pays.map(([n]) => `<span>${ecu(n)} ${n}</span>`).join('') + '<span>⚽ Clubs</span>';
  $('#band').innerHTML = band + band;
  // « Aussi en boutique » : écusson s'il existe, sinon pastille aux couleurs du pays ; un appui demande sur WhatsApp
  $('#aussi').innerHTML = AUSSI.map(({ pays, quoi, c }) => `<li><a href="${waLink(`Bonjour ! Vous avez encore : ${pays} ${quoi} ?`)}" target="_blank" rel="noopener">${
    ECUSSONS.includes(slugPays(pays)) ? ecu(pays) : `<i class="pastille" style="background:linear-gradient(90deg,${c.map((k, i) => `${k} ${i / c.length * 100}% ${(i + 1) / c.length * 100}%`).join(',')})"></i>`
  }<b>${pays}</b> ${quoi}</a></li>`).join('');

  // ---------- Mot pays qui change dans l'accueil ----------
  const word = $('#country-word');
  const cycle = ['Cameroun', 'Haïti', "Côte d'Ivoire", 'Cap-Vert', 'Sénégal', 'Togo', 'Maroc', 'Brésil', 'Centrafrique', 'Mali'];
  let ci = 0, choisi = null;
  theme(cycle[0]);
  setInterval(() => {
    if (document.hidden || scrollY > innerHeight || choisi) return;
    ci = (ci + 1) % cycle.length;
    const next = cycle[ci];
    if (hasGsap && !calme) {
      gsap.timeline()
        .to(word, { yPercent: -110, duration: .45, ease: 'power3.in' })
        .add(() => { word.textContent = next; if (!choisi) theme(next); })
        .fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: .6, ease: 'power3.out' });
    } else { word.textContent = next; if (!choisi) theme(next); }
  }, 2400);

  // pays choisi sur le globe : le mot du titre s'arrête sur ce pays
  window.choisirPays = nom => {
    choisi = nom;
    if (nom) { word.textContent = nom; theme(nom); }
  };

  // ---------- Chargement + entrée ----------
  const montrer = () => $$('.reveal').forEach(e => e.style.cssText = 'opacity:1;transform:none');
  const intro = () => {
    if (!hasGsap) { montrer(); return; }
    gsap.timeline({ delay: 2.1 })
      .from('.hero-title .split, .hero-title .country', { yPercent: 115, duration: 1.1, stagger: .09, ease: 'expo.out' }, '-=.5')
      .to('.hero .reveal', { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power3.out' }, '-=.8')
      .from('.top', { yPercent: -100, opacity: 0, duration: .8, ease: 'power3.out' }, '<')
      .from('.dock', { yPercent: 150, opacity: 0, duration: .8, ease: 'expo.out' }, '<');
  };
  if (calme) montrer();
  else {
    intro();
  }

  // ---------- Curseur + boutons aimantés (ordinateur) ----------
  const cursor = $('#cursor');
  if (fin && hasGsap) {
    const cx = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' });
    addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerover', e => cursor.classList.toggle('is-view', !!e.target.closest('.card')));
    $$('.magnet').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4 });
      });
      b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' }));
    });
  } else cursor.remove();

  // ---------- Pays + catalogue ----------
  const flags = $('#flags');
  flags.innerHTML = `<button class="flag is-on" data-p=""><i>🌍</i>Tous</button>` +
    pays.map(([nm]) => `<button class="flag" data-p="${nm}"><i>${ecu(nm)}</i>${nm}</button>`).join('');
  let filtrePays = '', filtreType = 'tout';
  flags.addEventListener('click', e => {
    const b = e.target.closest('.flag'); if (!b) return;
    $$('.flag', flags).forEach(x => x.classList.toggle('is-on', x === b));
    filtrePays = b.dataset.p; choisi = filtrePays || null;
    if (choisi) theme(choisi);
    render(true);
  });
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.toggle('is-on', x === t));
    filtreType = t.dataset.f; render(true);
  }));
  const garde = p => {
    const t = p.tags || [];
    if (filtrePays && p.pays !== filtrePays) return false;
    if (filtreType === 'tout') return true;
    if (filtreType === 'bebe-enfant') return (p.petits || []).length > 0;
    return t.includes(filtreType);
  };
  // tailles bébé / enfant : signalées sur le maillot adulte correspondant
  const petitsTxt = p => (p.petits || []).length ? `<p class="card-petits">Aussi en taille ${p.petits.map(x => x === 'bebe' ? 'bébé' : 'enfant').join(' et ')}</p>` : '';
  const badge = p => {
    const t = p.tags || [];
    if (t.includes('bebe')) return '<span class="card-badge">Bébé</span>';
    if (t.includes('enfant')) return '<span class="card-badge">Enfant</span>';
    if (t.includes('retro')) return '<span class="card-badge">Rétro</span>';
    if (p.top) return '<span class="card-badge gold">Top ventes</span>';
    if (t.includes('special')) return '<span class="card-badge">Édition spéciale</span>';
    return '';
  };

  // Vignettes 3D : rendues une par une quand la carte approche de l'écran
  const VIGNETTES = new Map();
  const fileVignettes = [];
  let enCours = false;
  // catalogue et fiche produit : vraies photos et vidéos (la 3D ne sert plus qu'au configurateur de flocage)
  const sans3D = () => true;
  const vignette3D = (p, el) => {
    if (sans3D(p)) return;
    if (VIGNETTES.has(p.img)) { el.src = VIGNETTES.get(p.img); el.classList.add('is-3d'); return; }
    fileVignettes.push([p, el]); pomper();
  };
  async function pomper() {
    if (enCours || !window.Jersey3D) return;
    enCours = true;
    while (fileVignettes.length) {
      const [p, el] = fileVignettes.shift();
      if (!VIGNETTES.has(p.img)) VIGNETTES.set(p.img, await Jersey3D.thumb(design(p)));
      $$(`img[data-v="${p.img}"]`).forEach(i => { i.src = VIGNETTES.get(p.img); i.classList.add('is-3d'); });
      await new Promise(r => (window.requestIdleCallback || setTimeout)(r, { timeout: 120 }));
    }
    enCours = false;
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const p = PRODUITS[+e.target.dataset.i];
    vignette3D(p, $('img', e.target));
  }), { rootMargin: '400px 0px' });

  const grid = $('#grid');
  let catalogueOuvert = false;
  $('#voir-plus').addEventListener('click', () => { catalogueOuvert = true; render(true); });
  let qCat = '';
  // rien trouvé : on propose les pays qui ressemblent à ce qui a été tapé
  const vide = q => {
    const sug = window.paysProches(q);
    return `<div class="vide"><p>Rien trouvé pour « ${q.replace(/[<>&"]/g, '')} ».</p>${sug.length ? `<p>Tu voulais dire : ${sug.map(n => `<button class="sugg" type="button" data-sugg="${n}">${ecu(n)}${n}</button>`).join(' ')}</p>` : ''}
      <a class="lien-fleche" href="${waLink(`Bonjour ! Vous avez le maillot : ${q} ?`)}" target="_blank" rel="noopener">On l'a peut-être en boutique, demande-nous →</a></div>`;
  };
  function render(anim) {
    const res = qCat ? window.chercherMaillots(qCat, PRODUITS.filter(garde)) : null;
    const tous = res || PRODUITS.filter(garde);
    const court = !res && !catalogueOuvert && !filtrePays && filtreType === 'tout';
    const list = court ? tous.slice(0, 8) : tous;
    const vp = $('#voir-plus');
    vp.hidden = !court || tous.length <= 8;
    vp.textContent = `Voir les ${tous.length - 8} autres maillots`;
    $('#count').textContent = `${tous.length} maillot${tous.length > 1 ? 's' : ''}`;
    if (res && !res.length) { grid.innerHTML = vide(qCat); return; }
    grid.innerHTML = list.map(p => {
      const [a, b] = coul(p.pays);
      const pret = VIGNETTES.get(p.img);
      return `<article class="card" data-i="${PRODUITS.indexOf(p)}" style="--k1:${a};--k2:${b}" tabindex="0" aria-label="${p.pays} ${p.version}, 35 euros">
        <div class="card-media">
          ${badge(p)}${sans3D(p) ? '' : '<span class="card-play" aria-hidden="true">3D</span>'}
          <img src="${pret || img(p)}" ${pret ? 'class="is-3d"' : ''} data-v="${p.img}" alt="Maillot ${p.pays} ${p.version}" loading="lazy">
          <video muted loop playsinline preload="none" data-src="${vid(p)}"></video>
        </div>
        <div class="card-body">
          <div><p class="card-pays">${ecu(p.pays)} ${p.pays}</p><h3>${p.version}</h3>${petitsTxt(p)}</div>
          <span class="card-price">35 €</span>
        </div>
      </article>`;
    }).join('');
    $$('.card', grid).forEach(c => {
      $('img', c).addEventListener('error', fallback);
      io.observe(c);
      const v = $('video', c);
      if (fin) {
        c.addEventListener('pointerenter', () => {
          if (!v.src) v.src = v.dataset.src;
          v.play().then(() => c.classList.add('is-playing')).catch(() => {});
        });
        c.addEventListener('pointerleave', () => { v.pause(); c.classList.remove('is-playing'); });
      }
      c.addEventListener('click', () => ouvrir(PRODUITS[+c.dataset.i]));
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(PRODUITS[+c.dataset.i]); } });
    });
    if (anim && hasGsap && !calme) gsap.from($$('.card', grid), { y: 40, opacity: 0, duration: .6, stagger: .03, ease: 'power3.out' });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  render(false);
  $('#q').addEventListener('input', e => {
    qCat = e.target.value.trim();
    if (qCat && filtrePays) { filtrePays = ''; $$('.flag', flags).forEach((x, i) => x.classList.toggle('is-on', !i)); }
    render(false);
  });
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-sugg]'); if (!b) return;
    $('#q').value = qCat = b.dataset.sugg; theme(qCat); render(true);
  });

  // ---------- Recherche depuis l'en-tête : un maillot n'importe où sur la page ----------
  const ch = $('#chercheur'), chQ = $('#ch-q'), chRes = $('#ch-res');
  const ouvrirCh = () => { ch.hidden = false; requestAnimationFrame(() => ch.classList.add('on')); chQ.focus(); majCh(); };
  const fermerCh = () => { ch.classList.remove('on'); setTimeout(() => { ch.hidden = true; }, 250); };
  function majCh() {
    const q = chQ.value.trim(), res = window.chercherMaillots(q);
    if (!res) { chRes.innerHTML = `<p class="ch-aide">Tape un pays, une couleur, « rétro », « enfant »… même mal écrit, on devine.</p>`; return; }
    if (!res.length) { chRes.innerHTML = vide(q); return; }
    chRes.innerHTML = res.slice(0, 8).map(p => `<button class="ch-item" type="button" data-i="${PRODUITS.indexOf(p)}"><img src="${img(p)}" alt="" loading="lazy"><span>${ecu(p.pays)}<b>${p.pays}</b> ${p.version}</span><i>35 €</i></button>`).join('')
      + (res.length > 8 ? `<p class="ch-aide">+ ${res.length - 8} autres dans le catalogue</p>` : '');
  }
  $('#top-search').addEventListener('click', ouvrirCh);
  chQ.addEventListener('input', majCh);
  ch.addEventListener('click', e => {
    if (e.target === ch || e.target.closest('.ch-fermer')) return fermerCh();
    const it = e.target.closest('.ch-item');
    if (it) { fermerCh(); ouvrir(PRODUITS[+it.dataset.i]); return; }
    const s = e.target.closest('[data-sugg]');
    if (s) { chQ.value = s.dataset.sugg; majCh(); }
  });
  chQ.addEventListener('keydown', e => {
    if (e.key === 'Escape') fermerCh();
    if (e.key === 'Enter') { const it = $('.ch-item', chRes); if (it) it.click(); }
  });
  addEventListener('keydown', e => { if (e.key === '/' && ch.hidden && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); ouvrirCh(); } });

  // ---------- Fiche produit (3D + vidéo réelle) ----------
  const viewer = $('#viewer');
  const vv = $('#v-video');
  const vm = $('#v-media');
  let v3d = null, courant = null, taille = null, retourFocus = null, modeRecup = 'boutique';

  function majCommande() {
    const floc = $('#v-floc').checked;
    $('#v-floc-fields').hidden = !floc;
    const total = PRIX + (floc ? FLOC : 0);
    $('#v-total').textContent = total;
    const nom = $('#v-nom').value.trim().toUpperCase(), num = $('#v-num').value.replace(/\D/g, '');
    let msg = `Bonjour Le Continent Store 👋\nJe voudrais le maillot ${courant.pays} ${courant.version}\nTaille : ${taille}`;
    if (floc) msg += `\nFlocage : ${nom || '(nom)'} ${num || '(numéro)'}`;
    msg += modeRecup === 'boutique' ? `\nRetrait en boutique (45 rue du Château d'Eau) : ${$('#v-jour').value}, ${$('#v-heure').value}` : `\nLivraison (je donne mon adresse)`;
    msg += `\nTotal : ${total} €\nC'est disponible ?`;
    $('#v-send').href = waLink(msg);
    if (v3d) v3d.redessiner(floc ? { nom, num } : { nom: '', num: '' });
  }
  function mode(m) {
    vm.classList.toggle('is-video', m === 'video');
    $$('.viewer-switch button').forEach(b => b.classList.toggle('is-on', b.dataset.mode === m));
    if (m === 'video') { if (!vv.src) vv.src = vid(courant); vv.play().catch(() => {}); } else vv.pause();
  }
  $$('.viewer-switch button').forEach(b => b.addEventListener('click', () => mode(b.dataset.mode)));

  $('#v-mode').addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    modeRecup = b.dataset.m;
    $('#v-creneau').hidden = modeRecup !== 'boutique';
    $$('#v-mode .size').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); });
    $('#v-note').textContent = modeRecup === 'boutique'
      ? "On te met le maillot de côté au 45 rue du Château d'Eau. Tu paies sur place en le récupérant."
      : 'On te donne les frais et le délai de livraison selon ton adresse. Rien n\'est payé en ligne.';
    majCommande();
  });

  // ---------- Réservation d'un créneau de retrait ----------
  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const jours = [];
  for (let d = new Date(), i = 0; jours.length < 7 && i < 14; i++, d = new Date(d.getTime() + 864e5)) {
    if (d.getDay() === 0) continue;                     // fermé le dimanche
    if (i === 0 && d.getHours() >= 19) continue;        // trop tard pour aujourd'hui
    jours.push(i === 0 ? "aujourd'hui" : i === 1 ? 'demain' : `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`);
  }
  $('#r-jour').innerHTML = jours.map(j => `<option>${j}</option>`).join('');
  const HEURES = ['11 h – 13 h', '13 h – 15 h', '15 h – 17 h', '17 h – 20 h'].map(h => `<option>${h}</option>`).join('');
  $('#r-heure').innerHTML = $('#v-heure').innerHTML = HEURES;
  $('#v-jour').innerHTML = $('#r-jour').innerHTML;
  ['v-jour', 'v-heure'].forEach(id => $('#' + id).addEventListener('change', () => majCommande()));
  $('#rdv').addEventListener('submit', e => {
    e.preventDefault();
    const nom = $('#r-nom').value.trim(), m = $('#r-maillot').value.trim();
    const msg = `Bonjour Le Continent Store ! Je réserve un retrait en boutique${nom ? ` (${nom})` : ''}.\nJour : ${$('#r-jour').value}\nHeure : ${$('#r-heure').value}${m ? `\nMaillot : ${m}` : ''}\nC'est bon pour vous ?`;
    window.open(waLink(msg), '_blank', 'noopener');
  });

  window.ouvrirProduit = p => ouvrir(p);
  function ouvrir(p) {
    courant = p; retourFocus = document.activeElement;
    const t = p.tags || [];
    const pt = p.petits || [];
    const tailles = ['S', 'M', 'L', 'XL', 'XXL']
      .concat(pt.includes('enfant') ? ['4 ans', '6 ans', '8 ans', '10 ans', '12 ans', '14 ans'] : [])
      .concat(pt.includes('bebe') ? ['Bébé 0-3 m', 'Bébé 3-6 m', 'Bébé 6-12 m', 'Bébé 12-18 m', 'Bébé 18-24 m'] : []);
    taille = tailles[Math.min(1, tailles.length - 1)];
    $('#v-sizes').innerHTML = tailles.map(x => `<button class="size${x === taille ? ' is-on' : ''}" role="radio" aria-checked="${x === taille}">${x}</button>`).join('');
    const [a] = coul(p.pays);
    viewer.style.setProperty('--k1', a);
    $('#v-pays').innerHTML = `${ecu(p.pays)} ${p.pays}`;
    $('#v-title').textContent = p.version;
    vv.pause(); vv.removeAttribute('src');
    $('#v-floc').checked = false; $('#v-nom').value = ''; $('#v-num').value = '';
    viewer.hidden = false;
    const en3D = window.Jersey3D && !sans3D(p);
    $('.viewer-switch').hidden = !en3D;
    if (en3D) {
      if (!v3d) v3d = Jersey3D.viewer($('#v-canvas'));
      v3d.set(design(p));
      v3d.montrerFace();
    }
    mode(en3D ? '3d' : 'video');
    majCommande();
    lenis && lenis.stop();
    document.body.style.overflow = 'hidden';
    if (hasGsap && !calme) {
      gsap.fromTo('.viewer-bg', { opacity: 0 }, { opacity: 1, duration: .35 });
      gsap.fromTo('.viewer-panel', { y: 60, opacity: 0, scale: .97 }, { y: 0, opacity: 1, scale: 1, duration: .55, ease: 'expo.out' });
    }
    $('.viewer-close').focus({ preventScroll: true });
  }
  function fermer() {
    vv.pause(); vv.removeAttribute('src'); vv.load();
    viewer.hidden = true;
    lenis && lenis.start();
    document.body.style.overflow = '';
    retourFocus && retourFocus.focus && retourFocus.focus({ preventScroll: true });
  }
  viewer.addEventListener('click', e => { if (e.target.closest('[data-close]')) fermer(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !viewer.hidden) fermer(); });
  $('#v-sizes').addEventListener('click', e => {
    const b = e.target.closest('.size'); if (!b) return;
    taille = b.textContent;
    $$('.size').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); });
    majCommande();
  });
  $('#v-num').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); });
  ['v-floc', 'v-nom', 'v-num'].forEach(id => $('#' + id).addEventListener('input', majCommande));
  $('#v-floc').addEventListener('change', () => { majCommande(); if (v3d) $('#v-floc').checked ? v3d.montrerDos() : v3d.montrerFace(); });

  // ---------- Configurateur de flocage 3D (les 3 maillots redessinés en 3D) ----------
  const EN3D = ['cameroun-edition-violet', 'domicile-maroc', 'domicile-cote-divoire'];
  const FLOCS = EN3D.map(k => PRODUITS.find(p => p.img === k)).filter(Boolean)
    .concat(PRODUITS.filter(p => !EN3D.includes(p.img)));
  $('#floc-n').textContent = `· ${FLOCS.length} au choix`;
  let fp = FLOCS[0], fV = null;
  $('#swatches').innerHTML = FLOCS.map((p, i) => {
    const [a, b] = coul(p.pays);
    const v = p.version.replace(/^Édition /, '').replace(/ 2026$/, '').toLowerCase();
    return `<button class="swatch${i ? '' : ' is-on'}" style="--a:${p.base || a};--b:${b}" data-i="${i}">${ecu(p.pays)}${p.pays} ${v}${EN3D.includes(p.img) ? '<em>3D</em>' : ''}</button>`;
  }).join('');
  const valeurs = () => ({ nom: ($('#f-nom').value.trim() || 'TON NOM').toUpperCase(), num: $('#f-num').value.replace(/\D/g, '').slice(0, 3) || '10' });
  function majFloc(nouveau) {
    const { nom, num } = valeurs();
    $('#f-send').href = waLink(`Bonjour ! Je veux le maillot ${fp.pays} ${fp.version} floqué ${nom} ${num} (35 € + 15 €), à récupérer en boutique. C'est possible ?`);
    const en3d = EN3D.includes(fp.img);
    $('#floc-canvas').hidden = !en3d; $('#floc-2d').hidden = en3d;
    $('#floc-mode').textContent = en3d ? '3D · glisse pour tourner' : 'Aperçu du dos floqué';
    if (!en3d) { dos2D(fp, nom, num); return; }
    if (!fV) return;
    if (nouveau) { fV.set(design(fp, { nom, num })); fV.montrerDos(); } else fV.redessiner({ nom, num });
  }

  // aperçu 2D : dos du maillot à plat (couleurs du maillot, liserés aux couleurs du pays) avec le flocage
  function dos2D(p, nom, num) {
    const c = $('#floc-2d'), W = 600, H = 640, r = Math.min(2, devicePixelRatio || 1);
    c.width = W * r; c.height = H * r;
    const x = c.getContext('2d'); x.setTransform(r, 0, 0, r, 0, 0); x.clearRect(0, 0, W, H);
    const [fond, acc] = (window.DOS && DOS[p.img]) || [p.base || '#333', '#888'];
    const [c1, c2, c3] = coul(p.pays);
    const forme = new Path2D('M215 70 Q300 98 385 70 L470 96 Q520 116 560 176 L586 236 L500 280 L470 232 L470 590 Q300 612 130 590 L130 232 L100 280 L14 236 L40 176 Q80 116 130 96 Z');
    x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 40; x.shadowOffsetY = 24; x.fillStyle = fond; x.fill(forme); x.restore();
    x.save(); x.clip(forme);
    const g = x.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(.22, 'rgba(255,255,255,.06)'); g.addColorStop(.5, 'rgba(255,255,255,.1)'); g.addColorStop(.78, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.globalAlpha = .18; x.fillStyle = acc;
    for (let k = -4; k < 12; k++) { x.beginPath(); x.moveTo(k * 70, H); x.lineTo(k * 70 + 260, 300); x.lineTo(k * 70 + 290, 300); x.lineTo(k * 70 + 30, H); x.fill(); }
    x.globalAlpha = 1;
    // poignets tricolores et col
    [[c1, 0], [c2, 9], [c3, 18]].forEach(([col, d]) => {
      x.strokeStyle = col; x.lineWidth = 8;
      x.beginPath(); x.moveTo(14 + d * .4, 236 - d * .9); x.lineTo(100 + d * .4, 280 - d * .9); x.stroke();
      x.beginPath(); x.moveTo(586 - d * .4, 236 - d * .9); x.lineTo(500 - d * .4, 280 - d * .9); x.stroke();
    });
    x.restore();
    x.strokeStyle = c1; x.lineWidth = 10; x.beginPath(); x.moveTo(215, 72); x.quadraticCurveTo(300, 100, 385, 72); x.stroke();
    // flocage
    const clair = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; };
    const txt = p.txt || (clair(fond) ? '#141414' : '#ffffff');
    x.fillStyle = txt; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowOffsetY = 3;
    let fs = 54; x.font = `900 ${fs}px Archivo, Impact, sans-serif`;
    while (x.measureText(nom).width * .8 > 300 && fs > 20) { fs -= 2; x.font = `900 ${fs}px Archivo, Impact, sans-serif`; }
    x.save(); x.translate(300, 200); x.scale(.8, 1); x.fillText(nom, 0, 0); x.restore();
    let fn = 250; x.font = `900 ${fn}px Archivo, Impact, sans-serif`;
    while (x.measureText(num).width * .72 > 330 && fn > 80) { fn -= 6; x.font = `900 ${fn}px Archivo, Impact, sans-serif`; }
    x.save(); x.translate(300, 440); x.scale(.72, 1); x.fillText(num, 0, 0); x.restore();
  }
  $('#swatches').addEventListener('click', e => {
    const b = e.target.closest('.swatch'); if (!b) return;
    fp = FLOCS[+b.dataset.i];
    $$('.swatch').forEach(x => x.classList.toggle('is-on', x === b));
    theme(fp.pays); choisi = fp.pays; majFloc(true);
  });
  // recherche dans les maillots à floquer : les plus proches remontent en tête, les autres se cachent
  $('#f-q').addEventListener('input', e => {
    const res = window.chercherMaillots(e.target.value, FLOCS);
    $$('.swatch').forEach(b => {
      const k = res ? res.indexOf(FLOCS[+b.dataset.i]) : +b.dataset.i;
      b.hidden = k < 0; b.style.order = k;
    });
    $('#swatches').scrollTop = 0;
    $('#floc-n').textContent = res ? `· ${res.length} trouvé${res.length > 1 ? 's' : ''}` : `· ${FLOCS.length} au choix`;
  });
  $('#f-num').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); });
  ['f-nom', 'f-num'].forEach(id => $('#' + id).addEventListener('input', () => majFloc(false)));
  majFloc(false);

  // ---------- Démarrage de la 3D ----------
  const demarrer3D = () => {
    fV = Jersey3D.viewer($('#floc-canvas'), { auto: false, rotation: Math.PI });
    majFloc(true);
  };
  // la 3D (modèle de 570 Ko) ne se charge qu'à l'approche du flocage : l'ouverture du site reste rapide sur téléphone
  addEventListener('jersey3d-ready', demarrer3D, { once: true });
  const charger3D = () => {
    if (charger3D.fait) return; charger3D.fait = true;
    const sc = document.createElement('script'); sc.type = 'module'; sc.src = 'jersey3d.js?v=14'; document.head.appendChild(sc);
  };
  new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); charger3D(); } }, { rootMargin: '900px 0px' }).observe($('#flocage'));
  addEventListener('load', () => setTimeout(charger3D, 3500), { once: true }); // sinon, une fois la page affichée et l'arrivée du globe finie

  // ---------- Apparitions au défilement ----------
  if (hasGsap && window.ScrollTrigger && !calme) {
    $$('.retrait-head, .etapes, .atouts, .catalog-head, .shop-card, .socials, .faq h2, .faq details, .aussi').forEach(el => {
      gsap.from(el.children.length > 1 ? el.children : el, {
        y: 40, opacity: 0, duration: .9, stagger: .07, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
    // flocage : le maillot 3D monte depuis le bas et grandit en arrivant, le texte glisse depuis la gauche
    gsap.fromTo('.floc-visual', { y: 140, scale: .82, opacity: 0 }, { y: 0, scale: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '#flocage', start: 'top bottom', end: 'top 25%', scrub: .8 } });
    gsap.fromTo('.floc-text', { x: -40, opacity: 0 }, { x: 0, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '#flocage', start: 'top 85%', end: 'top 35%', scrub: .8 } });
    // le bandeau des pays glisse en sens inverse quand on défile
    gsap.to('.band-track', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
    // catalogue : les cartes apparaissent par vagues
    ScrollTrigger.batch('.card', { start: 'top 92%', once: true,
      onEnter: b => gsap.fromTo(b, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .06, ease: 'power3.out', overwrite: true }) });
    // titres de section : léger décalage (parallaxe)
    $$('.big').forEach(h => gsap.fromTo(h, { y: 30 }, { y: -30, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('[data-count]').forEach(b => {
      const o = { v: 0 };
      gsap.to(o, { v: +b.dataset.count, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 92%' }, onUpdate: () => { b.textContent = Math.round(o.v); } });
    });
    gsap.to('.foot-word', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
