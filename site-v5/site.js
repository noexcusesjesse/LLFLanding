// Small progressive enhancements: mobile menu, header shadow, reveal-on-scroll.
(function () {
  var btn = document.querySelector('.menu-btn');
  var head = document.querySelector('.site-head');
  if (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      head.classList.toggle('open', open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && head.classList.contains('open')) { btn.click(); btn.focus(); }
    });
  }
  // Close nav dropdowns when clicking elsewhere.
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.drop details[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });
  var onScroll = function () { head && head.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach(function (el) { io.observe(el); });
})();
