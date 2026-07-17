/* Jaeuk Moon — portfolio interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var hamburger = document.getElementById('hamburger');
  var menu = document.getElementById('nav-menu');
  if (!hamburger || !menu) return;

  hamburger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
      menu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
})();
