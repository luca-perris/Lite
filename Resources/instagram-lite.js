// ==UserScript==
// @name         Instagram 2016
// @description  Niente Reels né Esplora. Feed "Seguiti" in ordine cronologico. I reel ricevuti in DM si aprono uno alla volta, senza scroll infinito.
// @version      1.0
// @match        https://www.instagram.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const HOME = '/?variant=following';   // feed solo account seguiti, in ordine cronologico
  const INBOX = '/direct/inbox/';
  const KEY = 'ig2016_prevReel';

  // ---------- CSS: nasconde i punti d'ingresso allo scroll infinito ----------
  const css = `
    /* Tab Reels nella barra di navigazione e nei profili */
    a[href="/reels/"],
    a[href$="/reels/"] { display: none !important; }

    /* Esplora: resta la barra di ricerca, sparisce la griglia di contenuti */
    html[data-ig16="explore"] a[href*="/p/"],
    html[data-ig16="explore"] a[href*="/reel/"] { display: none !important; }

    /* Pagina di un singolo post/reel: niente "Altri post" e suggeriti sotto */
    html[data-ig16="post"] a[href*="/p/"],
    html[data-ig16="post"] a[href*="/reel/"] { display: none !important; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  // ---------- Routing: blocca le pagine che portano allo scroll ----------
  function reelId(path) {
    const m = path.match(/^\/reels?\/([^/]+)\/?$/);
    return m ? m[1] : null;
  }

  function go(url) {
    location.replace(url);
  }

  function route() {
    const p = location.pathname;
    const id = reelId(p);

    // Se passi da un reel a un ALTRO reel senza uscire (= swipe), torni ai DM.
    let prev = null;
    try { prev = sessionStorage.getItem(KEY); } catch (e) {}
    try {
      if (id) sessionStorage.setItem(KEY, id);
      else sessionStorage.removeItem(KEY);
    } catch (e) {}
    if (id && prev && prev !== id) {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      return go(INBOX);
    }

    // Feed dei Reels -> home
    if (/^\/reels\/?$/.test(p)) return go(HOME);

    // /reels/ID (visore a scorrimento) -> /reel/ID (reel singolo)
    if (id && p.startsWith('/reels/')) return go('/reel/' + id + '/');

    // Tab Reels di un profilo -> profilo
    if (/^\/[^/]+\/reels\/?$/.test(p)) return go(p.replace(/reels\/?$/, ''));

    // Home -> sempre il feed "Seguiti"
    if (p === '/' && !location.search.includes('variant=following')) return go(HOME);

    // Segna il tipo di pagina per il CSS
    let mode = '';
    if (/^\/explore\/?$/.test(p)) mode = 'explore';
    else if (/^\/(?:[^/]+\/)?(?:p|reel)\/[^/]+\/?$/.test(p)) mode = 'post';
    document.documentElement.setAttribute('data-ig16', mode);
  }

  // ---------- Nasconde i blocchi "Suggeriti per te" ----------
  const SUGGESTED = /^(Suggested for you|Suggeriti per te|Suggerimenti per te|Suggested posts|Post suggeriti)$/i;
  function hideSuggested() {
    document.querySelectorAll('span, h2, h3, div[role="heading"]').forEach((el) => {
      if (el.childElementCount === 0 && SUGGESTED.test(el.textContent.trim())) {
        const box = el.closest('article') || el.closest('section') || el.parentElement?.parentElement;
        if (box && box.style.display !== 'none') box.style.display = 'none';
      }
    });
  }

  // Instagram è una single-page app: l'URL cambia senza ricaricare la pagina,
  // quindi controlliamo spesso.
  let lastHref = '';
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      route();
    }
  }, 200);

  const start = () => {
    new MutationObserver(hideSuggested).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
