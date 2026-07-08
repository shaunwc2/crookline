/*
 * Mobile nav toggle
 * ------------------
 * Below the 700px breakpoint (see style.css), the nav list is hidden behind
 * a hamburger button. This just toggles it open/closed and keeps
 * aria-expanded in sync for screen readers.
 */
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const nav = document.getElementById(btn.getAttribute('aria-controls'));
    if (!nav) return;
    const isOpen = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
});
