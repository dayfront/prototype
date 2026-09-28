// Runs in <head> so the page paints in the right theme from the first frame.
// Order: ?theme=light|dark (or #theme=...) in the URL, then the remembered choice, then the OS setting.
// A theme given in the URL is remembered too, so it carries on to the next page.
(function () {
  var t = null, m = (location.search + location.hash).match(/[?#&]theme=(light|dark)\b/);
  if (m) { t = m[1]; try { localStorage.setItem('dayfront-theme', t); } catch (e) {} }
  if (!t) { try { t = localStorage.getItem('dayfront-theme'); } catch (e) {} }
  if (t !== 'light' && t !== 'dark') t = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();
