// ==UserScript==
// @name         Instagram 2016
// @description  Niente Reels né Esplora. Feed "Seguiti". Reel dei DM uno alla volta.
// @version      1.0
// @match        https://www.instagram.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const HOME = '/?variant=following';
  const INBOX = '/direct/inbox/';
  const KEY = 'ig2016_prevReel';

  const css = `
    a[href="/reels/"],
    a[href$="/reels/"] { display: none !important; }
    html[data-ig16="explore"] a[href*="/p/"],
    html[data-ig16="explore"] a[href*="/reel/"] { display: none !important; }
    html[data-ig16="post"] a[href*="/p/"],
    html[data-ig16="post"] a[href*="/reel/"] { display: none !important; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  function reelId(path) {
    const m = path.match(/^\/reels?\/([^/]+)\/?$/);
    return m ? m[1] : null;
  }

  function go(url) { location.replace(url); }

  function route() {
    const p = location.pathname;
    const id = reelId(p);

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

    if (/^\/reels\/?$/.test(p)) return go(HOME);
    if (id && p.startsWith('/reels/')) return go('/reel/' + id + '/');
    if (/^\/[^/]+\/reels\/?$/.test(p)) return go(p.replace(/reels\/?$/, ''));
    if (p === '/' && !location.search.includes('variant=following')) return go(HOME);

    let mode = '';
    if (/^\/explore\/?$/.test(p)) mode = 'explore';
    else if (/^\/(?:[^/]+\/)?(?:p|reel)\/[^/]+\/?$/.test(p)) mode = 'post';
    document.documentElement.setAttribute('data-ig16', mode);
  }

  const SUGGESTED = /^(Suggested for you|Suggeriti per te|Suggerimenti per te|Suggested posts|Post suggeriti)$/i;
  function hideSuggested() {
    document.querySelectorAll('span, h2, h3, div[role="heading"]').forEach((el) => {
      if (el.childElementCount === 0 && SUGGESTED.test(el.textContent.trim())) {
        const box = el.closest('article') || el.closest('section') || el.parentElement?.parentElement;
        if (box && box.style.display !== 'none') box.style.display = 'none';
      }
    });
  }

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
