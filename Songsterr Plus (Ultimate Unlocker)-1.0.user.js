// ==UserScript==
// @name         🎸 Songsterr Ultimate
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Unlocks all Plus features (Speed, Loop, Solo) and Native Download (.gp7 and .midi). (Tested on Zen Browser)
// @author       Goulagman
// @supportURL   https://github.com/GoulagmanYt/Songsterr-Plus-Ultimate-Unlocker-
// @match        *://www.songsterr.com/*
// @require      https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.1/dist/alphaTab.min.js
// @connect      dqsljvtekg760.cloudfront.net
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  console.log('🎸 Songsterr Ultimate — Actif v3.1.0');

  // ═══════════════════════════════════════════════════════════════════
  // 0. NETTOYAGE PRÉVENTIF
  // Supprime l'état Redux mis en cache pour forcer une session propre
  // et éviter que le profil "free" ne soit chargé depuis le localStorage.
  // ═══════════════════════════════════════════════════════════════════
  try { localStorage.removeItem('persist:root'); } catch (e) {}

  // Référence à la vraie fenêtre (contourne l'isolation Tampermonkey)
  const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  // ═══════════════════════════════════════════════════════════════════
  // 1. PROFIL "MAGIQUE" PLUS
  // ID aléatoire à chaque session pour contourner la limite de
  // téléchargements journaliers (HTTP 429 Too Many Requests).
  // ═══════════════════════════════════════════════════════════════════
  const MAGIC_ID = Math.floor(Math.random() * 900000000) + 100000000;

  const MAGIC_PROFILE = {
    id                    : MAGIC_ID,
    uid                   : MAGIC_ID,
    email                 : `plususer${MAGIC_ID}@songsterr.com`,
    name                  : 'Plus User (Unlocked)',
    plan                  : 'plus',
    hasPlus               : true,
    permissions           : [],
    subscription          : { plan: { id: 'plus' } },
    bonusPurchasedFeatures: [],
    signature             : 'patched_signature',
    hadPlusBeforeSE       : true
  };

  // ═══════════════════════════════════════════════════════════════════
  // 2. INTERCEPTION RÉSEAU
  // On accroche fetch() très tôt (document-start) pour :
  //   A. Renvoyer notre faux profil Plus sur /auth/profile
  //   B. Bloquer les appels de logs/analytics/sentry (bruit inutile)
  //   NOTE : on ne touche PAS à /api/edits/download — notre téléchargeur
  //          GP7/MIDI est supérieur au .gp5 natif.
  // ═══════════════════════════════════════════════════════════════════
  const fetchOriginal = targetWindow.fetch;

  const fetchHooked = async function (resource, options) {
    // Détermine si resource est un objet Request ou une simple URL string
    const isReqObj = typeof resource === 'object' && resource instanceof Request;
    const url = isReqObj ? resource.url : (resource || '');

    // --- A. USURPATION DE PROFIL ---
    // Songsterr interroge cette route pour savoir si l'utilisateur a un abonnement.
    // On renvoie notre profil "plus" forgé pour débloquer Speed, Loop, Solo.
    if (url.includes('/auth/profile')) {
      return new Response(JSON.stringify(MAGIC_PROFILE), {
        status : 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // --- B. BLOCAGE DES LOGS & ANALYTICS ---
    // Évite d'envoyer des données de télémétrie pendant nos opérations.
    if (url.match(/(sentry|logs|analytics|useraudio)/i)) {
      return new Response('{}', { status: 200 });
    }

    // Toutes les autres requêtes passent normalement
    return fetchOriginal(resource, options);
  };

  // Mode furtif : toString() renvoie l'original pour déjouer les détections
  fetchHooked.toString = () => fetchOriginal.toString();

  // Injection robuste avec Object.defineProperty pour survivre aux re-définitions
  try {
    Object.defineProperty(targetWindow, 'fetch', {
      value      : fetchHooked,
      writable   : true,
      configurable: true
    });
  } catch (e) {
    targetWindow.fetch = fetchHooked; // Fallback navigateurs anciens
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. INJECTION D'ÉTAT DOM
  // Songsterr stocke son état Redux dans <script id="state">.
  // On observe le DOM dès que ce nœud apparaît et on y injecte
  // hasPlus:true + notre profil pour que React "croie" qu'on est abonné.
  // ═══════════════════════════════════════════════════════════════════
  const stateObserver = new MutationObserver(() => {
    const el = document.getElementById('state');
    if (!el) return;
    try {
      const text = el.textContent.trim();
      if (!text) return;
      const data = JSON.parse(text);

      if (!data.user) data.user = {};
      data.user.hasPlus    = true;
      data.user.isLoggedIn = true;
      data.user.profile    = MAGIC_PROFILE;
      // Supprime la bannière de consentement RGPD
      data.consent = { loading: false, suite: 'tcf', view: 'none' };

      const patched = JSON.stringify(data);
      if (el.textContent !== patched) el.textContent = patched;
    } catch (e) { /* JSON invalide, on ignore */ }
  });
  stateObserver.observe(document.documentElement, { childList: true, subtree: true });

  // ═══════════════════════════════════════════════════════════════════
  // 4. CSS — Nettoyage UI + styles de nos boutons
  // ═══════════════════════════════════════════════════════════════════
  GM_addStyle(`
    /* ── Masque les éléments indésirables ─────────────────────────── */
    section[data-consent="summary"],
    div[class*="Consent"],
    #onetrust-banner-sdk,
    [id*="ad-"],
    [class*="ad-"],
    div[id^="div-gpt-ad"],
    div[class*="Error"]
    { display: none !important; visibility: hidden !important; }

    body, html { overflow: auto !important; }
    #apptab    { opacity: 1 !important; visibility: visible !important; }

    /* ── Conteneur de nos boutons ──────────────────────────────────── */
    #sgd-wrapper {
      display      : inline-flex;
      align-items  : center;
      gap          : 12px;
    }

    /* ── Boutons GP7 & MIDI ────────────────────────────────────────── */
    .sgd-btn {
      display      : inline-flex;
      align-items  : center;
      gap          : 7px;
      padding      : 8px 16px;
      border       : none;
      border-radius: 8px;
      font-size    : 13px;
      font-weight  : 700;
      cursor       : pointer;
      white-space  : nowrap;
      box-shadow   : 0 2px 10px rgba(0,0,0,0.30);
      transition   : opacity .15s, transform .1s;
      font-family  : -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height  : 1;
      letter-spacing: 0.01em;
    }
    .sgd-btn:hover:not(:disabled)  { opacity: .82; transform: translateY(-1px); }
    .sgd-btn:active:not(:disabled) { transform: translateY(0); }
    .sgd-btn:disabled              { opacity: .4; cursor: not-allowed; }
    .sgd-btn-gp   { background: linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; }
    .sgd-btn-midi { background: linear-gradient(135deg,#1e293b,#0f172a); color:#fff; }

    /* ── Toast de statut centré en bas ────────────────────────────── */
    #sgd-status {
      position     : fixed;
      bottom       : 20px;
      left         : 50%;
      transform    : translateX(-50%);
      background   : rgba(15,23,42,.90);
      color        : #e2e8f0;
      font-size    : 12px;
      font-weight  : 500;
      padding      : 6px 16px;
      border-radius: 20px;
      z-index      : 99999;
      pointer-events: none;
      opacity      : 0;
      transition   : opacity .25s;
      font-family  : -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      white-space  : nowrap;
    }
    #sgd-status.visible { opacity: 1; }
    #sgd-status.ok  { color: #86efac; }
    #sgd-status.err { color: #fca5a5; }
  `);

  // ═══════════════════════════════════════════════════════════════════
  // 5. DÉVERROUILLAGE CIBLÉ DES FONCTIONNALITÉS PLUS
  //
  // ⚠️ PIÈGE CRITIQUE : on ne doit PAS retirer disabled sur TOUS les
  // boutons désactivés de la page. Le player de tab Songsterr utilise
  // des boutons disabled légitimement pendant son initialisation
  // (chargement audio, parsing de la tab…). Si on les force à enabled,
  // React perd la synchronisation entre son état interne et le DOM →
  // la tab se gèle au premier chargement.
  //
  // Solution : on cible UNIQUEMENT les boutons verrouillés par le
  // paywall Plus, identifiables par :
  //   1. Présence d'une icône cadenas SVG (use[href*="lock"]) dans
  //      le bouton ou son voisinage immédiat
  //   2. Un data-id connu lié aux features Plus (Speed, Loop, Solo…)
  //   3. La classe CSS spécifique du lock Songsterr (Cny223)
  // ═══════════════════════════════════════════════════════════════════

  // data-id des features connues du paywall Plus
  const PLUS_DATA_IDS = ['Speed', 'Loop', 'Solo', 'Autoscroll', 'Print'];

  setInterval(() => {
    // ── 1. Forcer le mode impression "Plus" ──────────────────────────
    const printEl = document.querySelector('[data-id^="Print--"]');
    if (printEl) printEl.setAttribute('data-id', 'Print--plus');

    // ── 2. Supprimer les icônes cadenas SVG ──────────────────────────
    // Ces <use href*="lock"> sont ajoutés par React sur les features Plus.
    // On retire l'icône et on débloque le bouton parent uniquement.
    document.querySelectorAll('svg use[href*="lock"]').forEach(use => {
      const svg    = use.closest('svg');
      const parent = svg?.closest('button');
      if (svg)    svg.remove();
      if (parent) {
        parent.removeAttribute('disabled');
        parent.classList.remove('Cny223');
        parent.style.pointerEvents = 'auto';
      }
    });

    // ── 3. Déverrouiller les boutons Plus par data-id ────────────────
    // On ne touche QUE les boutons dont le data-id correspond à une
    // feature connue du paywall — jamais les boutons du player.
    PLUS_DATA_IDS.forEach(id => {
      const el = document.querySelector(`[data-id*="${id}"]`);
      if (el && el.hasAttribute('disabled')) {
        el.removeAttribute('disabled');
        el.classList.remove('Cny223');
        el.style.pointerEvents = 'auto';
      }
    });

    // ── 4. Débloquer les boutons portant la classe de lock Songsterr ──
    document.querySelectorAll('button.Cny223').forEach(btn => {
      btn.removeAttribute('disabled');
      btn.classList.remove('Cny223');
      btn.style.pointerEvents = 'auto';
    });
  }, 1000);

  // ═══════════════════════════════════════════════════════════════════
  // 6. FILTRE CONSOLE
  // Supprime les erreurs bruyantes et sans intérêt pour la console.
  // ═══════════════════════════════════════════════════════════════════
  const consoleErrorOrig = console.error;
  const CONSOLE_FILTERS  = ['AudioContext', 'source-map', 'unreachable', 'buffer', 'Secure-YEC', 'Aborted', '401'];
  console.error = function (...args) {
    if (CONSOLE_FILTERS.some(f => String(args[0]).includes(f))) return;
    consoleErrorOrig.apply(console, args);
  };

  // ═══════════════════════════════════════════════════════════════════
  // ▼▼▼ NOTRE TÉLÉCHARGEUR GP7 / MIDI ▼▼▼
  // ═══════════════════════════════════════════════════════════════════

  // ───────────────────────────────────────────────────────────────────
  // CDN SONGSTERR — En-têtes qui simulent Chrome pour passer la
  // validation CloudFront (Origin + Referer sont obligatoires).
  // ───────────────────────────────────────────────────────────────────
  const CDN_BASE = 'https://dqsljvtekg760.cloudfront.net';

  const CDN_HEADERS = {
    'User-Agent'        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept'            : 'application/json, */*',
    'Accept-Language'   : 'en-US,en;q=0.9',
    'sec-ch-ua'         : '"Chromium";v="124","Google Chrome";v="124"',
    'sec-ch-ua-mobile'  : '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-site'    : 'same-origin',
    'sec-fetch-mode'    : 'cors',
    'sec-fetch-dest'    : 'empty',
    'Referer'           : 'https://www.songsterr.com/',
    'Origin'            : 'https://www.songsterr.com',
    'Cache-Control'     : 'no-cache',
    'Pragma'            : 'no-cache'
  };

  // ───────────────────────────────────────────────────────────────────
  // ÉTAPE 1 — Lire les métadonnées de la page
  // Songsterr injecte toutes les infos dans <script id="state">.
  // On en extrait : songId, revisionId, image, liste des pistes.
  // ───────────────────────────────────────────────────────────────────
  function getStateFromPage() {
    const el = document.getElementById('state');
    if (!el) throw new Error('Élément #state introuvable. Es-tu sur une page de tab ?');
    let parsed;
    try { parsed = JSON.parse(el.textContent || el.innerText); }
    catch (e) { throw new Error('Impossible de parser le JSON de la page : ' + e.message); }

    const cur = parsed?.meta?.current;
    if (!cur?.songId || !cur?.revisionId || !cur?.image) {
      throw new Error('Payload Songsterr incomplet (songId / revisionId / image manquants).');
    }
    return {
      songId    : cur.songId,
      revisionId: cur.revisionId,
      image     : cur.image,
      title     : cur.title  || 'Song',
      artist    : cur.artist || 'Unknown Artist',
      tracks    : Array.isArray(cur.tracks) ? cur.tracks : []
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // ÉTAPE 2 — Télécharger les JSONs de révision depuis le CDN
  // URL : {CDN_BASE}/{songId}/{revisionId}/{image}/{partId}.json
  // GM_xmlhttpRequest contourne les restrictions CORS du navigateur.
  // ───────────────────────────────────────────────────────────────────
  function fetchRevisionJson(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method      : 'GET',
        url,
        headers     : CDN_HEADERS,
        responseType: 'json',
        onload : res => {
          if (res.status >= 200 && res.status < 300) resolve(res.response);
          else reject(new Error(`HTTP ${res.status} — ${url}`));
        },
        onerror: err => reject(new Error(`Erreur réseau : ${JSON.stringify(err)}`))
      });
    });
  }

  async function fetchAllRevisions(meta) {
    const { songId, revisionId, image, tracks } = meta;
    const validTracks = tracks
      .filter(t => typeof t.partId === 'number')
      .sort((a, b) => a.partId - b.partId);

    if (validTracks.length === 0) throw new Error('Aucune piste valide dans les métadonnées.');

    const results = await Promise.all(
      validTracks.map(async track => {
        const url = `${CDN_BASE}/${songId}/${revisionId}/${image}/${track.partId}.json`;
        try {
          return { trackMeta: track, revision: await fetchRevisionJson(url) };
        } catch (err) {
          console.warn(`[SGD] Piste ${track.partId} ignorée :`, err.message);
          return null;
        }
      })
    );

    const revisions = results.filter(Boolean);
    if (revisions.length === 0) throw new Error('Aucune piste récupérée depuis le CDN.');
    return revisions;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Durée Songsterr [num, den] → Duration alphaTab + dots
  // Algorithme : minimisation du delta sur toutes les combinaisons
  // (durée de base × 0, 1 ou 2 points de pointé).
  // ───────────────────────────────────────────────────────────────────
  function mapDuration(dur) {
    const D     = alphaTab.model.Duration;
    const bases = [D.Whole, D.Half, D.Quarter, D.Eighth, D.Sixteenth, D.ThirtySecond, D.SixtyFourth];

    if (!dur?.[0] || !dur?.[1]) return { duration: D.Quarter, dots: 0 };

    const target = dur[0] / dur[1];
    let best = { duration: D.Quarter, dots: 0 };
    let bestDelta = Infinity;

    for (const base of bases) {
      const bv = 1 / Number(base);
      for (const dots of [0, 1, 2]) {
        const dv    = bv + (dots >= 1 ? bv / 2 : 0) + (dots >= 2 ? bv / 4 : 0);
        const delta = Math.abs(dv - target);
        if (delta < bestDelta) { bestDelta = delta; best = { duration: base, dots }; }
      }
    }
    return best;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Tuplet entier → [numérateur, dénominateur]
  // Exemples : 3 → [3,2], 5 → [5,4], 7 → [7,4]
  // ───────────────────────────────────────────────────────────────────
  function getTupletRatio(t) {
    const map = { 3:[3,2], 5:[5,4], 6:[6,4], 7:[7,4], 9:[9,8], 10:[10,8], 12:[12,8] };
    if (map[t]) return map[t];
    if (t > 1) { const d = Math.pow(2, Math.floor(Math.log2(t))); return [t, d]; }
    return [1, 1];
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — ID instrument Songsterr → programme MIDI + flags
  // ID 1024 = batterie → channel MIDI 9 (spécification MIDI Standard)
  // ───────────────────────────────────────────────────────────────────
  function mapInstrument(id) {
    if (id === 1024) return { program: 0, isPercussion: true };
    const prog = typeof id === 'number' ? Math.min(Math.max(id, 0), 127) : 24;
    return { program: prog, isPercussion: false };
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Index d'articulation percussion
  // Effectue un round-trip GP7 (export → import) pour construire une
  // map stable des index, indépendante des versions d'alphaTab.
  // ───────────────────────────────────────────────────────────────────
  let _percMap = null;

  function buildPercMap() {
    // Crée un score minimal avec une piste de percussion vide
    const score = new alphaTab.model.Score();
    const mb    = new alphaTab.model.MasterBar();
    score.addMasterBar(mb);
    const track = new alphaTab.model.Track();
    track.playbackInfo.primaryChannel   = 9;
    track.playbackInfo.secondaryChannel = 9;
    const staff   = new alphaTab.model.Staff();
    staff.isPercussion = true;
    track.addStaff(staff);
    const bar   = new alphaTab.model.Bar();
    const voice = new alphaTab.model.Voice();
    const beat  = new alphaTab.model.Beat();
    beat.isEmpty = true;
    voice.addBeat(beat); bar.addVoice(voice); staff.addBar(bar);
    score.addTrack(track);

    // Export → re-import pour lire les articulations telles qu'alphaTab les indexe
    const settings  = new alphaTab.Settings();
    score.finish(settings);
    const data       = new alphaTab.exporter.Gp7Exporter().export(score, settings);
    const reimported = alphaTab.importer.ScoreLoader.loadScoreFromBytes(data, settings);

    const map = new Map();
    reimported.tracks[0].percussionArticulations.forEach((a, i) => {
      if (!map.has(a.id)) map.set(a.id, i);
    });
    return map;
  }

  function getPercIndex(midiNote) {
    if (!_percMap) _percMap = buildPercMap();
    return _percMap.get(midiNote) ?? midiNote;
  }

  // ───────────────────────────────────────────────────────────────────
  // TABLES DE CORRESPONDANCE
  // ───────────────────────────────────────────────────────────────────
  const VELOCITY_MAP = {
    ppp: alphaTab.model.DynamicValue.PPP,
    pp : alphaTab.model.DynamicValue.PP,
    p  : alphaTab.model.DynamicValue.P,
    mp : alphaTab.model.DynamicValue.MP,
    mf : alphaTab.model.DynamicValue.MF,
    f  : alphaTab.model.DynamicValue.F,
    ff : alphaTab.model.DynamicValue.FF,
    fff: alphaTab.model.DynamicValue.FFF
  };

  const HARMONIC_MAP = {
    natural   : alphaTab.model.HarmonicType.Natural,
    artificial: alphaTab.model.HarmonicType.Artificial,
    pinch     : alphaTab.model.HarmonicType.Pinch,
    tap       : alphaTab.model.HarmonicType.Tap,
    semi      : alphaTab.model.HarmonicType.Semi,
    feedback  : alphaTab.model.HarmonicType.Feedback
  };

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Construction des mesures maîtresses (MasterBars)
  // Gère : signatures rhythmiques, marqueurs de section, répétitions,
  // fins alternatives et automations de tempo (BPM).
  // ───────────────────────────────────────────────────────────────────
  function buildMasterBars(score, masterRev, count) {
    let sigNum = 4, sigDen = 4;

    for (let i = 0; i < count; i++) {
      const m  = masterRev?.measures?.[i];
      const s  = m?.signature;

      // Met à jour la signature si présente et valide
      if (Array.isArray(s) && s.length === 2 && s[0] && s[1]) [sigNum, sigDen] = s;

      const mb = new alphaTab.model.MasterBar();
      mb.timeSignatureNumerator   = sigNum;
      mb.timeSignatureDenominator = sigDen;

      // Marqueur de section (ex : "Verse", "Chorus"…)
      if (m?.marker) {
        const text = typeof m.marker === 'string' ? m.marker : (m.marker?.text || '');
        const sec  = new alphaTab.model.Section();
        sec.marker = sec.text = text;
        mb.section = sec;
      }

      if (m?.repeatStart)                                            mb.isRepeatStart  = true;
      if (typeof m?.repeatCount    === 'number' && m.repeatCount > 0)  mb.repeatCount    = m.repeatCount;
      if (typeof m?.alternateEnding === 'number' && m.alternateEnding > 0) mb.alternateEndings = m.alternateEnding;

      score.addMasterBar(mb);
    }

    // Automations de tempo — toujours en référence noire (index 2)
    const tempo = masterRev?.automations?.tempo;
    if (Array.isArray(tempo)) {
      for (const pt of tempo) {
        const mb = score.masterBars[pt.measure];
        if (!mb) continue;
        const ratio = pt.position > 0 ? Math.max(0, Math.min(1, pt.position / (pt.type || 4))) : 0;
        mb.tempoAutomations.push(
          alphaTab.model.Automation.buildTempoAutomation(false, ratio, pt.bpm, 2, true)
        );
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Note Songsterr → alphaTab Note
  // ★ Cordes : Songsterr 0 = corde la + haute, alphaTab 1 = la + basse
  // ★ Bend   : Songsterr centièmes × 2 = quarts de ton (alphaTab)
  // ───────────────────────────────────────────────────────────────────
  function mapNote(nd, isPerc, numStrings) {
    const note  = new alphaTab.model.Note();
    note.string = isPerc ? 0 : numStrings - (nd.string ?? 0);
    note.fret   = nd.fret ?? 0;

    // Index d'articulation pour la batterie
    if (isPerc) note.percussionArticulation = getPercIndex(nd.fret ?? 0);

    if (nd.tie)         note.isTieDestination   = true;
    if (nd.dead)        note.isDead             = true;
    if (nd.ghost)       note.isGhost            = true;
    if (nd.hp)          note.isHammerPullOrigin = true;
    if (nd.staccato)    note.isStaccato         = true;
    if (nd.accentuated) note.accentuated        = alphaTab.model.AccentuationType.Heavy;

    if (nd.wideVibrato)  note.vibrato = alphaTab.model.VibratoType.Wide;
    else if (nd.vibrato) note.vibrato = alphaTab.model.VibratoType.Slight;

    // Harmonique
    if (nd.harmonic) {
      const ht = HARMONIC_MAP[nd.harmonic.toLowerCase()];
      if (typeof ht === 'number') {
        note.harmonicType = ht;
        if (typeof nd.harmonicFret === 'number') note.harmonicValue = nd.harmonicFret;
      }
    }

    // Slide (glissé)
    if (nd.slide) {
      const s = nd.slide.toLowerCase();
      const Out = alphaTab.model.SlideOutType, In = alphaTab.model.SlideInType;
      if      (s === 'shift')                             note.slideOutType = Out.Shift;
      else if (s === 'legato')                            note.slideOutType = Out.Legato;
      else if (s === 'into_from_below' || s === 'below') note.slideInType  = In.IntoFromBelow;
      else if (s === 'into_from_above')                  note.slideInType  = In.IntoFromAbove;
      else if (s === 'out_up')                           note.slideOutType = Out.OutUp;
      else if (s === 'out_down' || s === 'downwards')    note.slideOutType = Out.OutDown;
    }

    // Bend — ★ ×2 car Songsterr = centièmes de demi-ton, alphaTab = quarts de ton
    if (nd.bend?.points?.length > 0) {
      note.bendType = alphaTab.model.BendType.Custom;
      for (const pt of nd.bend.points) {
        note.addBendPoint(new alphaTab.model.BendPoint(
          Math.round(pt.position),
          Math.round(pt.tone * 2)  // ★ facteur ×2
        ));
      }
    }

    return note;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Beat Songsterr → alphaTab Beat
  // Gère : durées, points, tuplets, dynamiques, vibrato, palm mute…
  // ───────────────────────────────────────────────────────────────────
  function mapBeat(bd, masterBar, isPerc, numStrings) {
    const beat = new alphaTab.model.Beat();
    if (bd.rest) beat.isEmpty = true;

    const dur    = mapDuration(bd.duration);
    beat.duration = dur.duration;
    beat.dots     = bd.dots ?? dur.dots;

    if (bd.text) beat.text = bd.text;

    // Tuplet : on recalcule la durée de base depuis le champ `type`
    if (typeof bd.tuplet === 'number' && bd.tuplet > 1) {
      const [n, d]    = getTupletRatio(bd.tuplet);
      beat.tupletNumerator   = n;
      beat.tupletDenominator = d;
      if (typeof bd.type === 'number' && bd.type > 0) {
        beat.duration = mapDuration([1, bd.type]).duration;
        beat.dots     = bd.dots ?? 0;
      }
    }

    // Nuance dynamique
    if (typeof bd.velocity === 'string') {
      const dyn = VELOCITY_MAP[bd.velocity.toLowerCase()];
      if (typeof dyn === 'number') beat.dynamics = dyn;
    }

    // Sens du coup de médiator
    if (typeof bd.pickStroke === 'string') {
      const ps = bd.pickStroke.toLowerCase();
      if (ps === 'down') beat.pickStroke = alphaTab.model.PickStroke.Down;
      else if (ps === 'up') beat.pickStroke = alphaTab.model.PickStroke.Up;
    }

    // Vibrato de beat
    if (bd.wideVibrato || bd.vibratoWithTremoloBar) beat.vibrato = alphaTab.model.VibratoType.Wide;
    else if (bd.vibrato)                            beat.vibrato = alphaTab.model.VibratoType.Slight;

    if (bd.palmMute) beat.isPalmMute = true;

    // Ajout des notes
    for (const nd of (bd.notes || [])) {
      if (!nd.rest) beat.addNote(mapNote(nd, isPerc, numStrings));
    }

    return beat;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Remplir une voix vide par des silences
  // Utilisé quand une mesure n'a aucun beat (mesure de silence totale).
  // ───────────────────────────────────────────────────────────────────
  function fillWithRests(voice, masterBar) {
    const num = masterBar.timeSignatureNumerator   || 4;
    const den = masterBar.timeSignatureDenominator || 4;
    const dur = mapDuration([1, den]);
    for (let i = 0; i < num; i++) {
      const rest = new alphaTab.model.Beat();
      rest.isEmpty  = true;
      rest.duration = dur.duration;
      rest.dots     = dur.dots;
      voice.addBeat(rest);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Construire une piste alphaTab complète
  // Gère le tuning (ordre inversé Songsterr vs alphaTab), le channel
  // MIDI percussion (9), et toutes les mesures.
  // ───────────────────────────────────────────────────────────────────
  function buildTrack(score, entry, masterBarCount, channel) {
    const { trackMeta, revision } = entry;
    const playback = mapInstrument(trackMeta.instrumentId ?? revision.instrumentId);
    const isPerc   = playback.isPercussion || !!trackMeta.isDrums;

    const track = new alphaTab.model.Track();
    track.name      = trackMeta.title || trackMeta.name || revision.name || 'Track';
    track.shortName = track.name.slice(0, 20);
    track.playbackInfo.program          = playback.program;
    track.playbackInfo.primaryChannel   = channel;
    track.playbackInfo.secondaryChannel = channel;

    const staff = new alphaTab.model.Staff();
    staff.isPercussion = isPerc;

    // ★ Tuning : Songsterr stocke haut→bas, alphaTab attend bas→haut (on passe tel quel)
    const tuning = revision.tuning || trackMeta.tuning;
    if (Array.isArray(tuning) && tuning.length > 0 && !isPerc) {
      staff.stringTuning = new alphaTab.model.Tuning('Custom', tuning, false);
    }
    const numStrings = Array.isArray(tuning) ? tuning.length : 6;

    for (let mi = 0; mi < masterBarCount; mi++) {
      const bar    = new alphaTab.model.Bar();
      const m      = revision.measures?.[mi];
      const mb     = score.masterBars[mi];
      const voices = m?.voices || [];

      if (voices.length === 0) {
        const v = new alphaTab.model.Voice();
        fillWithRests(v, mb);
        bar.addVoice(v);
      } else {
        for (const sv of voices) {
          const v    = new alphaTab.model.Voice();
          const bts  = sv?.beats || [];
          if (bts.length === 0 || sv?.rest) {
            fillWithRests(v, mb);
          } else {
            for (const bd of bts) v.addBeat(mapBeat(bd, mb, isPerc, numStrings));
            if (v.beats.length === 0) fillWithRests(v, mb);
          }
          bar.addVoice(v);
        }
      }
      staff.addBar(bar);
    }

    track.addStaff(staff);
    score.addTrack(track);
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Assembler le Score alphaTab complet
  // La piste la plus longue sert de référence pour les MasterBars.
  // Le channel 9 est réservé à la batterie (norme MIDI Général).
  // ───────────────────────────────────────────────────────────────────
  function buildScore(meta, revisions) {
    const score   = new alphaTab.model.Score();
    score.title   = meta.title;
    score.artist  = meta.artist;
    score.tab     = 'Songsterr Ultimate v3';

    // La piste avec le plus de mesures est la référence maîtresse
    const masterRev = revisions.reduce((best, cur) =>
      (cur.revision?.measures?.length || 0) > (best.revision?.measures?.length || 0) ? cur : best
    ).revision;

    const masterBarCount = Math.max(1,
      revisions.reduce((m, e) => Math.max(m, e.revision?.measures?.length || 0), 0)
    );

    buildMasterBars(score, masterRev, masterBarCount);

    // Attribution des channels MIDI (0–15, sauf 9 réservé batterie)
    let nextChannel = 0;
    for (const entry of revisions) {
      const id    = entry.trackMeta.instrumentId ?? entry.revision.instrumentId;
      const isPerc = id === 1024 || !!entry.trackMeta.isDrums;
      let channel;
      if (isPerc) {
        channel = 9;
      } else {
        if (nextChannel === 9) nextChannel++; // Saute le channel 9 (batterie)
        channel = nextChannel++;
      }
      buildTrack(score, entry, masterBarCount, channel);
    }

    const settings = new alphaTab.Settings();
    score.finish(settings); // ★ Obligatoire — finalise les liaisons internes
    return { score, settings };
  }

  // ───────────────────────────────────────────────────────────────────
  // EXPORT GP7 — Renvoie un Uint8Array au format Guitar Pro 7 (.gp)
  // ───────────────────────────────────────────────────────────────────
  function exportGP7(meta, revisions) {
    const { score, settings } = buildScore(meta, revisions);
    return new alphaTab.exporter.Gp7Exporter().export(score, settings);
  }

  // ───────────────────────────────────────────────────────────────────
  // EXPORT MIDI — Renvoie un Uint8Array au format MIDI standard (.mid)
  // ───────────────────────────────────────────────────────────────────
  function exportMIDI(meta, revisions) {
    const { score, settings } = buildScore(meta, revisions);
    const midiFile  = new alphaTab.midi.MidiFile();
    const handler   = new alphaTab.midi.AlphaSynthMidiFileHandler(midiFile, true);
    new alphaTab.midi.MidiFileGenerator(score, settings, handler).generate();
    return midiFile.toBinary();
  }

  // ───────────────────────────────────────────────────────────────────
  // UTILITAIRE — Déclenche le téléchargement d'un Uint8Array
  // ───────────────────────────────────────────────────────────────────
  function triggerDownload(bytes, fileName, mime) {
    const blob = new Blob([bytes], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Convertit le titre en nom de fichier sûr (pas de caractères spéciaux)
  function safeName(str) {
    return str.replace(/[^a-zA-Z0-9 _\-]/g, '').trim().replace(/\s+/g, '_') || 'tab';
  }

  // ───────────────────────────────────────────────────────────────────
  // UI — Toast de statut centré en bas de l'écran
  // ───────────────────────────────────────────────────────────────────
  let _toastTimer = null;
  let _toast = null;

  function getToast() {
    if (!_toast) {
      _toast = document.createElement('div');
      _toast.id = 'sgd-status';
      document.body.appendChild(_toast);
    }
    return _toast;
  }

  function showStatus(msg, type = '', duration = 4500) {
    const t = getToast();
    t.textContent = msg;
    t.className   = 'visible ' + type;
    clearTimeout(_toastTimer);
    if (duration > 0) {
      _toastTimer = setTimeout(() => {
        t.className = '';
      }, duration);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // FLUX PRINCIPAL — appelé au clic sur l'un de nos boutons
  // 4 étapes : lecture page → fetch CDN → conversion → téléchargement
  // ───────────────────────────────────────────────────────────────────
  async function handleDownload(format, btnGP, btnMID) {
    btnGP.disabled  = true;
    btnMID.disabled = true;
    showStatus('⏳ Lecture de la page…', '', 0);

    try {
      // 1. Lire les métadonnées depuis #state
      const meta = getStateFromPage();
      showStatus(`⏳ Récupération de ${meta.tracks.length} piste(s)…`, '', 0);

      // 2. Télécharger tous les JSONs de révision depuis le CDN
      const revisions = await fetchAllRevisions(meta);
      showStatus(`⚙️ Conversion de ${revisions.length} piste(s) → ${format.toUpperCase()}…`, '', 0);

      // 3. Construire et exporter
      const name = safeName(`${meta.artist} - ${meta.title}`);
      let bytes, fileName, mime;

      if (format === 'gp') {
        bytes    = exportGP7(meta, revisions);
        fileName = `${name}.gp`;
        mime     = 'application/gp';
      } else {
        bytes    = exportMIDI(meta, revisions);
        fileName = `${name}.mid`;
        mime     = 'audio/midi';
      }

      // 4. Déclencher le téléchargement navigateur
      triggerDownload(bytes, fileName, mime);
      showStatus(`✅ "${fileName}" téléchargé !`, 'ok');

    } catch (err) {
      console.error('[SGD] Erreur :', err);
      showStatus(`❌ ${err.message}`, 'err', 7000);
    } finally {
      btnGP.disabled  = false;
      btnMID.disabled = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. INJECTION DES BOUTONS — Remplace le bouton d'export natif
  //
  // Le bouton natif est dans : <div id="c-export" class="B3a4pa B3agq5">
  // La barre est un flex container (.B3a1lv).
  // On remplace le div#c-export entier par notre wrapper en lui
  // donnant les mêmes classes B3a4pa + B3agq5 → centrage automatique.
  //
  // Résistance SPA : MutationObserver + hook pushState/popstate.
  // ═══════════════════════════════════════════════════════════════════

  function isTabPage() {
    return /\/a\/wsa\/.+/.test(location.pathname);
  }

  function createOurButtons() {
    // On reprend les classes du conteneur natif pour hériter du layout flex
    const wrapper    = document.createElement('div');
    wrapper.id       = 'sgd-wrapper';
    wrapper.className = 'B3a4pa B3agq5'; // classes du div#c-export original

    const btnGP      = document.createElement('button');
    btnGP.className  = 'sgd-btn sgd-btn-gp';
    btnGP.innerHTML  = '🎸 GP7';
    btnGP.title      = 'Télécharger Guitar Pro 7 (.gp)';

    const btnMID     = document.createElement('button');
    btnMID.className = 'sgd-btn sgd-btn-midi';
    btnMID.innerHTML = '🎹 MIDI';
    btnMID.title     = 'Télécharger MIDI (.mid)';

    btnGP.addEventListener('click',  () => handleDownload('gp',   btnGP, btnMID));
    btnMID.addEventListener('click', () => handleDownload('midi', btnGP, btnMID));

    wrapper.appendChild(btnGP);
    wrapper.appendChild(btnMID);
    return wrapper;
  }

  function tryInjectButtons() {
    if (!isTabPage()) return false;

    // Déjà injecté et toujours dans le DOM → rien à faire
    if (document.getElementById('sgd-wrapper')?.isConnected) return true;

    // ── Cible principale : div#c-export (sélecteur stable) ───────────
    const cExport = document.getElementById('c-export');
    if (cExport) {
      cExport.replaceWith(createOurButtons());
      console.log('[SGD] ✅ Injecté (#c-export)');
      return true;
    }

    // ── Fallback : bouton #control-export ────────────────────────────
    const ctrlExport = document.getElementById('control-export');
    if (ctrlExport) {
      const parent = ctrlExport.closest('div') || ctrlExport.parentElement;
      parent.replaceWith(createOurButtons());
      console.log('[SGD] ✅ Injecté (#control-export parent)');
      return true;
    }

    // ── Fallback : data-id ou title "Download" ────────────────────────
    const nativeBtn = document.querySelector(
      '[data-id*="Download"], [data-id*="Export"], [title*="Download tab"]'
    );
    if (nativeBtn) {
      const anchor = nativeBtn.closest('div') || nativeBtn.parentElement;
      anchor.replaceWith(createOurButtons());
      console.log('[SGD] ✅ Injecté (fallback title)');
      return true;
    }

    return false;
  }

  // ── MutationObserver : ré-injecte si le wrapper est supprimé ───────
  const btnObserver = new MutationObserver(() => {
    if (!document.getElementById('sgd-wrapper')?.isConnected) {
      tryInjectButtons();
    }
  });

  // ── Hook SPA ───────────────────────────────────────────────────────
  function onSpaNavigate() {
    setTimeout(tryInjectButtons, 300);
    setTimeout(tryInjectButtons, 900);
    setTimeout(tryInjectButtons, 1800);
  }

  const _pushState    = history.pushState.bind(history);
  history.pushState   = function (...a) { _pushState(...a);     onSpaNavigate(); };
  const _replaceState = history.replaceState.bind(history);
  history.replaceState = function (...a) { _replaceState(...a); onSpaNavigate(); };
  window.addEventListener('popstate', onSpaNavigate);

  // ── Démarrage ──────────────────────────────────────────────────────
  function startObserving() {
    const go = () => {
      btnObserver.observe(document.body, { childList: true, subtree: true });
      tryInjectButtons();
    };
    if (document.body) go();
    else document.addEventListener('DOMContentLoaded', go);
  }

  startObserving();

})();