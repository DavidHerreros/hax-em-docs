/* ---------------------------------------------------------------------------
   Hax documentation — lightweight scroll-reveal animations.
   Adds the `.hax-in` class to elements as they scroll into view. Styling lives
   in stylesheets/extra.css. Honours `prefers-reduced-motion`.
   --------------------------------------------------------------------------- */

function haxInitReveal() {
  // Skip entirely if the user prefers reduced motion.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Also freeze the animated SVG showcase for these users.
    document.querySelectorAll(".hax-showcase svg").forEach((svg) => {
      if (typeof svg.pauseAnimations === "function") {
        svg.pauseAnimations();
      }
    });
    return;
  }

  // Elements worth animating on the content pages.
  const selectors = [
    ".md-content .grid.cards > ul > li",
    ".md-content .grid.cards > ol > li",
    ".md-content .md-typeset > h2",
    ".md-content .hax-reveal",
  ];

  const targets = document.querySelectorAll(selectors.join(", "));
  if (!targets.length) {
    return;
  }

  // Fallback: if IntersectionObserver is unavailable, just show everything.
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("hax-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("hax-in");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => {
    el.classList.add("hax-pre");
    observer.observe(el);
  });
}

// Material for MkDocs exposes a `document$` observable that re-fires on
// instant navigation; fall back to a plain DOMContentLoaded otherwise.
if (typeof document$ !== "undefined" && document$.subscribe) {
  document$.subscribe(haxInitReveal);
} else if (document.readyState !== "loading") {
  haxInitReveal();
} else {
  document.addEventListener("DOMContentLoaded", haxInitReveal);
}
