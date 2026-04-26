/* ============================================================
   Nav — active links, language toggle, mobile menu, cart button
   ============================================================ */

(function () {
  'use strict';

  var LANG_KEY = 'lang';

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  }

  function highlightActiveLink() {
    var path = window.location.pathname;
    // Get just the filename from the path (e.g. "/Online-N-yttely-Suomi/competitions.html" → "competitions.html")
    var currentFile = path.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-link');
    links.forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('/').pop().split('?')[0];
      if (href && href === currentFile) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function bindCartButton() {
    var btn = document.getElementById('cartBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (window.Cart) Cart.openDrawer();
      });
    }
  }

  function bindMobileMenu() {
    var menuBtn = document.getElementById('menuBtn');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', function () {
      var isOpen = mobileMenu.style.display !== 'none';
      mobileMenu.style.display = isOpen ? 'none' : 'block';
    });

    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.style.display = 'none';
      });
    });
  }

  function bindLangToggle() {
    var toggleBtn = document.getElementById('langToggle');
    if (!toggleBtn) return;
    var lang = getLang();
    toggleBtn.textContent = lang === 'fi' ? 'EN' : 'FI';
    toggleBtn.addEventListener('click', function () {
      var current = getLang();
      var next = current === 'fi' ? 'en' : 'fi';
      setLang(next);
      toggleBtn.textContent = next === 'fi' ? 'EN' : 'FI';
    });
  }

  function init() {
    highlightActiveLink();
    bindCartButton();
    bindMobileMenu();
    bindLangToggle();
    if (window.Cart) Cart.updateBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
