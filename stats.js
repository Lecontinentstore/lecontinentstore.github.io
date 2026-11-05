// Statistiques du site avec Microsoft Clarity (gratuit) : cartes de chaleur, enregistrements de visites,
// profondeur de défilement, clics « rageurs »… plus nos propres événements (WhatsApp, fiches ouvertes,
// recherches sans résultat, filtres, flocage). Tableau de bord : https://clarity.microsoft.com
// Loi française (CNIL) : Clarity n'est chargé qu'après un « OK » du visiteur ; avant, les événements attendent.
// Test : ajouter ?stats=debug à l'adresse pour voir chaque événement dans la console.
(() => {
  const CLARITY_ID = 'z8k9sn5v63';                                       // identifiant du projet Clarity (Paramètres > Aperçu)
  const debug = /[?&]stats=debug/.test(location.search);
  if (!CLARITY_ID && !debug) return;

  let accord = null;
  try { accord = localStorage.getItem('stats'); } catch (e) {}
  const attente = [];
  const envoyer = (k, v) => {
    if (debug) console.log('[stats]', k, v || '');
    if (!window.clarity) return;
    if (v === undefined) clarity('event', k);
    else { clarity('set', k, String(v).slice(0, 80)); clarity('event', `${k} · ${String(v).slice(0, 60)}`); }
  };
  // un événement : « nom » seul (compté) ou « nom » + valeur (compté par valeur, et filtrable sur les visites)
  window.stat = (k, v) => { if (accord === 'oui') envoyer(k, v); else if (accord !== 'non') attente.push([k, v]); };

  function chargerClarity() {
    if (!CLARITY_ID) { attente.splice(0).forEach(e => envoyer(...e)); return; }
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
    document.head.appendChild(s);
    clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    attente.splice(0).forEach(e => envoyer(...e));
  }
  if (accord === 'oui') chargerClarity();

  // ---------- bandeau discret (en bas, ne bloque rien) ----------
  if (!accord) {
    const b = document.createElement('div');
    b.className = 'cookies'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Statistiques du site');
    b.innerHTML = `<p>On mesure la visite du site (anonyme) pour l'améliorer. D'accord ?</p>
      <button type="button" data-c="oui">OK</button><button type="button" data-c="non">Non merci</button>`;
    b.addEventListener('click', e => {
      const c = e.target.dataset && e.target.dataset.c; if (!c) return;
      accord = c; try { localStorage.setItem('stats', c); } catch (er) {}
      b.classList.add('part'); setTimeout(() => b.remove(), 400);
      if (c === 'oui') chargerClarity(); else attente.length = 0;
    });
    const poser = () => { document.body.appendChild(b); requestAnimationFrame(() => b.classList.add('on')); };
    setTimeout(poser, 6000);                                   // une fois l'intro du globe finie
  }

  const $ = s => document.querySelector(s);
  const texte = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();

  // ---------- clics ----------
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (a) {
      const h = a.href;
      if (/wa\.me/.test(h)) {
        const ou = a.id === 'v-send' ? 'commande fiche' : a.id === 'f-send' ? 'commande flocage'
          : a.closest('#aussi') ? 'aussi en boutique' : a.classList.contains('lien-fleche') ? 'maillot introuvable' : 'contact';
        stat('whatsapp', ou);
        if (a.id === 'v-send') stat('commande', `${texte($('#v-pays'))} ${texte($('#v-title'))}`);
      } else if (/google\.[^/]+\/maps/.test(h)) stat('itinéraire');
      else if (/tiktok|instagram/.test(h)) stat('réseau', h.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''));
      else if (/^tel:/.test(h)) stat('appel');
      return;
    }
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('flag')) stat('filtre pays', texte(b));
    else if (b.classList.contains('tab')) stat('onglet', texte(b));
    else if (b.classList.contains('swatch')) stat('flocage maillot', texte(b).replace(/3D$/, ''));
    else if (b.classList.contains('gc-item')) stat('globe', 'maillot ouvert');
    else if (b.closest('#v-age')) stat('version', texte(b).split(' ·')[0]);
    else if (b.closest('#v-sizes')) stat('taille', texte(b));
    else if (b.closest('#v-mode')) stat('récupération', b.dataset.m);
    else if (b.id === 'top-search') stat('recherche en-tête');
    else if (b.id === 'son') stat('musique', b.classList.contains('on') ? 'coupée' : 'mise');
    else if (b.id === 'voir-plus') stat('voir plus');
  }, true);
  document.addEventListener('submit', e => { if (e.target.id === 'rdv') stat('whatsapp', 'réservation retrait'); }, true);
  document.addEventListener('change', e => { if (e.target.id === 'v-floc' && e.target.checked) stat('flocage ajouté à la fiche'); }, true);

  // ---------- fiches produit ouvertes ----------
  const viewer = $('#viewer');
  if (viewer) new MutationObserver(() => {
    if (!viewer.hidden) setTimeout(() => stat('fiche', `${texte($('#v-pays'))} ${texte($('#v-title'))}`), 50);
  }).observe(viewer, { attributes: true, attributeFilter: ['hidden'] });

  // ---------- recherches : ce que les gens tapent, et surtout ce qu'on n'a pas ----------
  const minut = {};
  ['q', 'ch-q', 'f-q'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('input', () => {
      clearTimeout(minut[id]);
      minut[id] = setTimeout(() => {
        const q = el.value.trim().toLowerCase(); if (q.length < 3) return;
        const res = window.chercherMaillots ? window.chercherMaillots(q) : null;
        stat(res && !res.length ? 'recherche sans résultat' : 'recherche', q);
      }, 1500);                                                // on attend la fin de la frappe
    });
  });

  // ---------- jusqu'où on descend : chaque partie vue une fois ----------
  const PARTIES = { hero: 'accueil', pays: 'catalogue', 'rayon-enfants': 'rayon enfants', flocage: 'flocage', retrait: 'réservation', boutique: 'boutique' };
  const vu = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    vu.unobserve(en.target); stat('partie vue', PARTIES[en.target.id]);
  }), { rootMargin: '0px 0px -50% 0px' });   // partie vue quand elle atteint le milieu de l'écran
  Object.keys(PARTIES).forEach(id => { const el = document.getElementById(id); if (el) vu.observe(el); });
})();
