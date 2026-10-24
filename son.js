// Musique d'ambiance « galaxie » pour l'intro, composée en direct par le navigateur (Web Audio) : aucun fichier, aucun droit.
// Nappes d'accords lentes + notes cristallines au hasard + basse très grave, le tout dans une grande réverbération.
// Activée d'office, douce ; elle baisse en descendant et se tait après l'accueil (revient si on remonte).
// Les navigateurs bloquent le son avant un geste du visiteur : on essaie tout de suite, sinon au premier toucher / clic / touche.
// Bouton en bas à droite pour couper ou remettre ; le choix est retenu (localStorage).
(() => {
  const btn = document.getElementById('son');
  if (!btn || !(window.AudioContext || window.webkitAudioContext)) { btn && btn.remove(); return; }
  let voulu = true;
  try { voulu = localStorage.getItem('son') !== 'off'; } catch (e) {}
  let ctx = null, maitre = null, joue = false, minuteurs = [];
  const VOLUME = .24;                                          // doux : c'est un fond pour l'intro
  // part du volume selon la position : 1 en haut de page, 0 une fois l'accueil passé
  const presence = () => Math.max(0, Math.min(1, 1 - scrollY / (innerHeight * .75)));

  const hz = n => 440 * Math.pow(2, (n - 69) / 12);          // note MIDI -> fréquence
  // accords (notes MIDI) : D maj9, B m9, G maj7(#11), A sus — doux, lumineux, « spatial »
  const ACCORDS = [[50, 57, 64, 66, 69], [47, 54, 61, 62, 66], [43, 50, 57, 59, 66], [45, 52, 59, 61, 64]];
  const ETOILES = [74, 76, 78, 81, 83, 86, 88, 90];           // pentatonique de ré, aigu

  function reverb(sec = 6) {
    const r = ctx.sampleRate, n = r * sec, b = ctx.createBuffer(2, n, r);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
    }
    const v = ctx.createConvolver(); v.buffer = b; return v;
  }

  function demarrer() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    maitre = ctx.createGain(); maitre.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    maitre.connect(comp).connect(ctx.destination);
    const rev = reverb(), revG = ctx.createGain(); revG.gain.value = .9;
    rev.connect(revG).connect(maitre);
    const sec = ctx.createGain(); sec.gain.value = .55; sec.connect(maitre); sec.connect(rev);

    // filtre des nappes qui respire lentement
    const filtre = ctx.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 900; filtre.Q.value = .7;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .05; lfoG.gain.value = 450;
    lfo.connect(lfoG).connect(filtre.frequency); lfo.start();
    filtre.connect(sec);

    // basse très grave, continue
    const basse = ctx.createOscillator(), basseG = ctx.createGain();
    basse.type = 'sine'; basse.frequency.value = hz(38); basseG.gain.value = .05;
    basse.connect(basseG).connect(maitre); basse.start();

    let i = 0;
    const accord = () => {
      if (ctx.state !== 'running') { minuteurs.push(setTimeout(accord, 1000)); return; }   // en pause : rien ne s'empile
      const t = ctx.currentTime, notes = ACCORDS[i++ % ACCORDS.length], dur = 11;
      basse.frequency.setTargetAtTime(hz(notes[0] - 12), t, 2);
      for (const n of notes) for (const det of [-6, 6]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = det;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(.022, t + 4);          // montée lente
        g.gain.linearRampToValueAtTime(.022, t + dur - 1);
        g.gain.linearRampToValueAtTime(0, t + dur + 4);       // fondu enchaîné avec l'accord suivant
        o.connect(g).connect(filtre); o.start(t); o.stop(t + dur + 4.2);
      }
      minuteurs.push(setTimeout(accord, dur * 1000));
    };
    const etoile = () => {
      if (ctx.state !== 'running') { minuteurs.push(setTimeout(etoile, 1000)); return; }
      const t = ctx.currentTime, n = ETOILES[Math.floor(Math.random() * ETOILES.length)];
      const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      o.type = 'sine'; o.frequency.value = hz(n);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 3.5);
      if (p) { p.pan.value = Math.random() * 1.6 - .8; o.connect(g).connect(p).connect(rev); p.connect(maitre); }
      else { o.connect(g).connect(rev); }
      o.start(t); o.stop(t + 3.6);
      minuteurs.push(setTimeout(etoile, 1500 + Math.random() * 3500));
    };
    accord(); minuteurs.push(setTimeout(etoile, 2500));
  }

  // iPhone : en mode silencieux, Safari coupe le son « Web Audio ». On déclare une lecture de musique
  // (audioSession, iOS 17+) et on fait tourner en boucle un petit fichier muet dans un <audio>,
  // ce qui fait passer tout le son du site sur le canal « musique », comme une vidéo.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  let muet = null;
  function canalMusique() {
    if (!muet) {
      const n = 8000, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);   // WAV 8 kHz, 1 s de silence
      const ec = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      ec(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ec(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      ec(36, 'data'); v.setUint32(40, n * 2, true);
      muet = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' })));
      muet.loop = true; muet.setAttribute('playsinline', ''); muet.volume = .01;
    }
    muet.play().catch(() => {});
  }
  // à appeler pendant un geste du visiteur : débloque vraiment l'audio sur iPhone (son vide joué tout de suite)
  function debloquer() {
    canalMusique();
    const src = ctx.createBufferSource(); src.buffer = ctx.createBuffer(1, 1, 22050); src.connect(ctx.destination); src.start(0);
  }

  function jouer(geste) {
    if (!ctx) { demarrer(); ctx.onstatechange = maj; }
    if (geste) debloquer();
    ctx.resume().then(maj, maj);
    maitre.gain.cancelScheduledValues(ctx.currentTime);
    maitre.gain.setTargetAtTime(VOLUME * presence(), ctx.currentTime, 1.5);   // fondu d'entrée doux
    joue = true; maj();
  }
  function couper() {
    if (!ctx) { joue = false; maj(); return; }
    if (muet) muet.pause();
    maitre.gain.cancelScheduledValues(ctx.currentTime);
    maitre.gain.setTargetAtTime(0, ctx.currentTime, .25);
    setTimeout(() => { if (!joue) ctx.suspend(); }, 900);
    joue = false; maj();
  }
  function maj() {
    const vrai = joue && ctx && ctx.state === 'running';      // le son sort vraiment
    btn.classList.toggle('on', vrai);
    btn.classList.toggle('attente', voulu && !vrai);   // voulu mais pas encore débloqué : on invite à toucher
    btn.querySelector('.son-txt').textContent = btn.classList.contains('attente') ? 'Activer le son' : 'Son';
    btn.setAttribute('aria-pressed', vrai);
    btn.setAttribute('aria-label', vrai ? 'Couper la musique' : 'Mettre la musique');
    btn.title = vrai ? 'Couper la musique' : 'Mettre la musique';
  }
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const actif = joue && ctx && ctx.state === 'running';
    if (actif) { couper(); voulu = false; } else { voulu = true; jouer(true); }
    try { localStorage.setItem('son', voulu ? 'on' : 'off'); } catch (er) {}
    maj();
  });
  // premier geste du visiteur : on lance la musique s'il ne l'a pas coupée
  // premier geste du visiteur : on lance la musique s'il ne l'a pas coupée. On garde l'écoute tant que le son
  // n'est pas vraiment débloqué (sur iPhone, un glissement pour défiler ne compte pas, il faut un toucher).
  const GESTES = ['pointerdown', 'keydown', 'touchend', 'click'];
  const premier = e => {
    if (e.target && e.target.closest && e.target.closest('#son')) return;
    if (!voulu) return;
    jouer(true);
    ctx.resume().then(() => { if (ctx.state === 'running') GESTES.forEach(t => removeEventListener(t, premier, true)); });
  };
  GESTES.forEach(t => addEventListener(t, premier, true));
  // onglet caché : on se tait ; retour : on reprend si la musique jouait
  let avant = false;
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { avant = joue; if (joue) ctx.suspend(); }
    else if (avant && joue) ctx.resume();
  });
  // au défilement : la musique s'efface en quittant l'accueil, le bouton aussi
  let tic = false, arret = 0;
  addEventListener('scroll', () => {
    if (tic) return; tic = true;
    requestAnimationFrame(() => {
      tic = false;
      const k = presence();
      btn.classList.toggle('loin', k === 0);
      if (!ctx || !joue) return;
      if (k > 0 && ctx.state === 'suspended' && !document.hidden) ctx.resume();
      maitre.gain.setTargetAtTime(VOLUME * k, ctx.currentTime, .3);
      clearTimeout(arret);
      if (k === 0) arret = setTimeout(() => { if (presence() === 0) ctx.suspend(); }, 1500);
    });
  }, { passive: true });
  maj();
  // essai immédiat (accepté par certains navigateurs, sinon on attend le premier geste)
  if (voulu && presence() > 0) {
    try {
      jouer();   // sans geste : marche seulement si le navigateur l'autorise ; sinon le bouton propose « Activer le son »
    } catch (e) {}
  }
})();
