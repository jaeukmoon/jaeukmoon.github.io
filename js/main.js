/* Jaeuk Moon — portfolio interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =====================================================
     1. Nav: hide on scroll down, show (shrunk + shadow) on scroll up
     ===================================================== */
  var nav = document.getElementById('nav');
  var lastScrollY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var currentY = window.scrollY;
    var menuOpen = document.body.classList.contains('blurred');

    if (!menuOpen) {
      if (currentY <= 0) {
        nav.classList.remove('nav--scrolled', 'nav--hidden');
      } else if (currentY > lastScrollY && currentY > 100) {
        nav.classList.add('nav--hidden');
        nav.classList.add('nav--scrolled');
      } else if (currentY < lastScrollY) {
        nav.classList.remove('nav--hidden');
        nav.classList.add('nav--scrolled');
      }
    }
    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  /* =====================================================
     2. Mobile hamburger menu
     ===================================================== */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  var backdrop = document.getElementById('mobile-backdrop');

  function setMenu(open) {
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    document.body.classList.toggle('blurred', open);
  }

  hamburger.addEventListener('click', function () {
    setMenu(hamburger.getAttribute('aria-expanded') !== 'true');
  });

  backdrop.addEventListener('click', function () {
    setMenu(false);
  });

  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setMenu(false);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      hamburger.focus();
    }
  });

  /* =====================================================
     3. Experience tabs (click + arrow-key navigation)
     ===================================================== */
  var tablist = document.querySelector('.jobs__tablist');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.jobs__tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.jobs__panel'));

  function selectTab(index, focus) {
    tabs.forEach(function (tab, i) {
      var selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      panels[i].hidden = !selected;
    });
    tablist.style.setProperty('--active-tab', index);
    tablist.style.setProperty('--active-tab-offset', tabs[index].offsetLeft + 'px');
    tablist.style.setProperty('--active-tab-width', tabs[index].offsetWidth + 'px');
    if (focus) {
      tabs[index].focus();
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      selectTab(i, false);
    });
  });

  tablist.addEventListener('keydown', function (e) {
    var current = tabs.findIndex(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    });
    var next = current;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      next = (current + 1) % tabs.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      next = (current - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    selectTab(next, true);
  });

  /* =====================================================
     4. Scroll reveal (IntersectionObserver)
     ===================================================== */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    // Stagger siblings inside grids/lists.
    var staggerParents = document.querySelectorAll('.projects-grid, .research-list');
    staggerParents.forEach(function (parent) {
      var children = parent.querySelectorAll('.reveal');
      children.forEach(function (child, i) {
        child.style.setProperty('--reveal-delay', (i % 4) * 100 + 'ms');
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.05 }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
