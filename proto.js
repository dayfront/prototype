// Dayfront clickable prototype. Static pages: nothing is saved; clicks move between screens or explain what would happen.
(function () {
  var root = document.documentElement, stage = document.getElementById('proto-stage');
  var KEY = 'dayfront-theme';
  function store(kind, key, value) { try { var s = window[kind]; if (value === undefined) return s.getItem(key); if (value === null) s.removeItem(key); else s.setItem(key, value); } catch (e) {} return null; }
  function make(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) { el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return el;
  }

  // ---- what the previous page handed over ----
  // A prototype link carries the theme, privacy mode and the arrival toast in the URL hash
  // (#theme=dark&privacy=1&toast=...), so they reach the next page even where a browser keeps
  // storage apart for each file:// page. proto-theme.js has already applied the theme. The hash is
  // then removed so the address bar stays clean.
  var carried = {};
  (location.hash.slice(1) || '').split('&').forEach(function (kv) {
    var i = kv.indexOf('=');
    if (i > 0) { try { carried[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); } catch (e) {} }
  });
  if (carried.theme) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }

  // ---- fit the 1440x900 board to the window, above a 48px strip that holds the Prototype bar ----
  var STRIP = 48;
  function fit() {
    var w = window.innerWidth, h = Math.max(window.innerHeight - STRIP, 60);
    var s = Math.min(w / 1440, h / 900);
    var x = (w - 1440 * s) / 2, y = (h - 900 * s) / 2;
    stage.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
  }
  window.addEventListener('resize', fit); fit();

  // ---- theme ----
  var toggle = document.querySelector('[data-part="theme-toggle"]');
  function theme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function label() {
    if (!toggle) return;
    var l = 'Switch to ' + (theme() === 'light' ? 'dark' : 'light') + ' theme';
    toggle.setAttribute('aria-label', l); toggle.setAttribute('title', l);
  }
  function setTheme(t) { root.setAttribute('data-theme', t); store('localStorage', KEY, t); label(); }
  label();
  window.addEventListener('storage', function (e) { if (e.key === KEY && e.newValue) { root.setAttribute('data-theme', e.newValue); label(); } });
  // true when a click lands on the sun/moon switch, even through a dialog's scrim that covers it
  function onToggle(e) {
    if (!toggle) return false;
    if (toggle.contains(e.target)) return true;
    if (!e.target.closest('[data-part*="scrim"]') || e.target.closest('[role="dialog"]')) return false;
    var r = toggle.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  // ---- toasts ----
  var toast = make('div', { id: 'proto-toast', role: 'status' }); document.body.appendChild(toast);
  var timer = null;
  function say(text, ms) {
    toast.textContent = text; toast.classList.add('show');
    clearTimeout(timer); timer = setTimeout(function () { toast.classList.remove('show'); }, ms || 3600);
  }
  if (carried.toast) setTimeout(function () { say(carried.toast); }, 250);

  var privBtn = stage.querySelector('[data-toast="privacy"]');  // the top-bar eye (privacy mode), if the page has one

  // ---- moving between pages ----
  function go(href, msg) {
    var p = ['theme=' + theme()];
    if (privBtn ? stage.classList.contains('df-privacy') : store('sessionStorage', 'df-privacy') === '1') p.push('privacy=1');
    if (msg) p.push('toast=' + encodeURIComponent(msg));
    var same = false;
    try { same = new URL(href, location.href).pathname === location.pathname; } catch (e) {}
    location.href = href + '#' + p.join('&');
    if (same) location.reload();  // a link to this same page only changes the hash, so load it again
  }

  // ---- hotspots ----
  // A wired button the board shows as disabled still explains itself: browsers drop clicks on
  // disabled buttons, so keep the look (the boards style it inline) and mark it aria-disabled.
  [].forEach.call(stage.querySelectorAll('[data-go][disabled],[data-toast][disabled]'), function (b) {
    b.removeAttribute('disabled'); b.setAttribute('aria-disabled', 'true');
  });
  function flash() { stage.classList.remove('proto-flash'); void stage.offsetWidth; stage.classList.add('proto-flash'); setTimeout(function () { stage.classList.remove('proto-flash'); }, 950); }

  // ---- prototype bar + Screens menu ----
  var screensBtn = make('button', { type: 'button', id: 'proto-screens', 'aria-expanded': 'false', 'aria-controls': 'proto-menu' }, ['Screens']);
  var hotBtn = make('button', { type: 'button', id: 'proto-hot', 'aria-pressed': 'false' }, ['Show clickable', make('kbd', {}, ['H'])]);
  document.body.appendChild(make('div', { id: 'proto-bar' }, [make('span', { 'class': 'proto-tag' }, [make('i'), 'Prototype']), screensBtn, hotBtn]));
  var menu = make('nav', { id: 'proto-menu', 'aria-label': 'All screens' }); menu.hidden = true;
  var groups = {};
  (window.DF_PAGES || []).forEach(function (p) { (groups[p.group] = groups[p.group] || []).push(p); });
  Object.keys(groups).forEach(function (g) {
    menu.appendChild(make('h3', {}, [g]));
    groups[g].forEach(function (p) {
      var a = make('a', { href: p.href }, [make('i'), p.title]);
      if (p.arrive) a.setAttribute('data-arrive', p.arrive);
      if (p.slug === window.DF_PAGE) a.setAttribute('aria-current', 'page');
      menu.appendChild(a);
    });
  });
  menu.appendChild(make('p', {}, ['Static prototype with fictional data. Nothing is saved.']));
  document.body.appendChild(menu);
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (a) { e.preventDefault(); go(a.getAttribute('href'), a.getAttribute('data-arrive')); }
  });
  function openMenu(open) { menu.hidden = !open; screensBtn.setAttribute('aria-expanded', String(open)); }
  screensBtn.addEventListener('click', function (e) { e.stopPropagation(); openMenu(menu.hidden); });
  function setHot(on) { stage.classList.toggle('proto-hot', on); hotBtn.setAttribute('aria-pressed', String(on)); }
  hotBtn.addEventListener('click', function (e) { e.stopPropagation(); setHot(!stage.classList.contains('proto-hot')); });

  // ---- keys: H, Esc, and the Enter hints the boards print (↵ and ⌘↵) ----
  // The wired button whose label ends in the hint: "Continue with passkey ↵", "Unlock ↵", "Send SMS ⌘↵".
  function hinted(cmd) {
    var els = stage.querySelectorAll('button[data-go],button[data-toast]');
    for (var i = 0; i < els.length; i++) {
      var t = els[i].textContent.replace(/\s+/g, ' ').trim();
      if (cmd ? /⌘ ?↵$/.test(t) : (/↵$/.test(t) && !/⌘ ?↵$/.test(t))) return els[i];
    }
    return null;
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target, tag = t.tagName, inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
    if (e.key === 'Enter' && !e.altKey && !e.shiftKey && !e.repeat) {
      var cmd = e.metaKey || e.ctrlKey;
      // plain Enter on a focused link or button already clicks it; in a field it belongs to the field
      if (!cmd && (inField || (t !== document.body && t.closest && t.closest('a,button,summary,[role="button"]')))) return;
      var b = hinted(cmd);
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if (inField || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'h' || e.key === 'H') setHot(!stage.classList.contains('proto-hot'));
    if (e.key === 'Escape') openMenu(false);
  });

  // ---- privacy mode (the top-bar eye button) ----
  // Blurs every patient detail on the screen; the sidebar and the top-bar controls stay usable.
  // It stays on from page to page until it is turned off, and signing in starts with it off.
  function setPrivacy(on) {
    stage.classList.toggle('df-privacy', on);
    privBtn.setAttribute('aria-pressed', String(on));
    privBtn.setAttribute('aria-label', 'Privacy mode, ' + (on ? 'on' : 'off'));
    store('sessionStorage', 'df-privacy', on ? '1' : null);
  }
  if (window.DF_PAGE === 'signin') store('sessionStorage', 'df-privacy', null);
  else if (privBtn) setPrivacy(carried.theme ? carried.privacy === '1' : store('sessionStorage', 'df-privacy') === '1');
  function privacy() {
    var on = !stage.classList.contains('df-privacy');
    setPrivacy(on);
    say(on ? 'Privacy mode on: patient names, details and balances are blurred while a patient can see the screen. It stays on as you move between screens.' : 'Privacy mode off.');
  }

  // ---- clicks ----
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target)) openMenu(false);
    if (!stage.contains(e.target)) return;
    if (onToggle(e)) { e.preventDefault(); setTheme(theme() === 'light' ? 'dark' : 'light'); return; }
    var el = e.target.closest('[data-go],[data-toast],[data-dismiss]');
    if (el) {
      e.preventDefault();
      var href = el.getAttribute('data-go'), msg = el.getAttribute('data-toast');
      if (msg === 'privacy') { privacy(); return; }
      if (el.hasAttribute('data-dismiss')) {
        // close the dialog this control sits in (and its scrim), so the screen behind can be clicked
        var dlg = el.closest('[role="dialog"]'), layer = dlg && (dlg.parentElement.closest('[data-part*="scrim"]') || dlg);
        if (layer) layer.style.display = 'none';
        if (msg) say(msg);
        return;
      }
      if (href) { go(href, msg); return; }
      say(msg); return;
    }
    if (e.target.closest('[data-here]')) { e.preventDefault(); say('You are on this screen.'); return; }
    if (e.target.closest('[data-part*="scrim"]') && !e.target.closest('[role="dialog"]')) {
      e.preventDefault(); say('Finish or cancel the dialog first. Cancel closes it so you can click the screen behind.'); flash(); return;
    }
    var a = e.target.closest('a[href^="#"]');
    if (a) {
      e.preventDefault();
      var id = a.getAttribute('href').slice(1), target = id && document.getElementById(id);
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (target.focus) target.focus({ preventScroll: true }); }
      else { say('That view is not in the prototype yet. The outlined areas are wired.'); flash(); }
      return;
    }
    if (e.target.closest('button')) { e.preventDefault(); say('This control is not wired in the prototype. The outlined areas are.'); flash(); return; }
    if (!e.target.closest('input,select,textarea,label')) flash();
  });

  if (window.DF_PAGE === 'signin' && !carried.toast && store('sessionStorage', 'df-hello') !== '1') {
    store('sessionStorage', 'df-hello', '1');
    setTimeout(function () { say('Clickable prototype. Start with "Continue with passkey" or press Enter. Press H to outline what is wired, or use Screens.', 6000); }, 400);
  }
})();
