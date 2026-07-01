/* Lilja Belz, Soul Portraits, progressive enhancement only */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  /* ---- Personalized greeting: ?für=/?fuer=/?name= in the hero ----
     Runs before the reveal-on-scroll setup below so an unhidden slot is
     picked up by the same IntersectionObserver as the rest of the hero. */
  (function () {
    var slot = document.querySelector(".hero-greeting");
    if (!slot || !window.URLSearchParams) return;
    var template = slot.getAttribute("data-greeting-template");
    if (!template) return;
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("für") || params.get("fuer") || params.get("name");
    if (!raw) return;
    var name = raw.trim();
    if (!name || name.length > 30 || !/^[\p{L}][\p{L}\s'-]*$/u.test(name)) return;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    slot.textContent = template.replace("{name}", name);
    slot.hidden = false;
  })();

  /* ---- Gallery blur-up: fade each portrait in over its LQIP placeholder ---- */
  Array.prototype.slice.call(document.querySelectorAll(".gallery-item img")).forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add("is-loaded");
    } else {
      var done = function () { img.classList.add("is-loaded"); };
      img.addEventListener("load", done);
      img.addEventListener("error", done);
    }
  });

  /* ---- Header background on scroll ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Reveal on scroll ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // gentle stagger between siblings in the same container, eased and capped
        var parent = el.parentElement;
        var siblings = parent ? Array.prototype.slice.call(parent.querySelectorAll(":scope > .reveal")) : [el];
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = (idx > 0 ? Math.min(60 + idx * 45, 320) : 0) + "ms";
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Scroll spy: mark the section you are reading in the header nav ---- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav a:not(.nav-cta)")
  );
  if (navLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    var watched = [];
    navLinks.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace(/^#/, "");
      var section = id && document.getElementById(id);
      if (section) {
        linkFor[id] = link;
        watched.push(section);
      }
    });

    var setActive = function (id) {
      navLinks.forEach(function (link) {
        link.classList.toggle("is-active", link === linkFor[id]);
      });
    };

    var spy = new IntersectionObserver(
      function (entries) {
        // Choose the section closest to the top of the viewport that is in view
        var best = null;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) {
              best = entry;
            }
          }
        });
        if (best) setActive(best.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    watched.forEach(function (section) { spy.observe(section); });
  }

  /* ---- Mobile navigation (accessible dialog-style overlay) ---- */
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("mobile-nav");
  var main = document.getElementById("main");
  var footer = document.querySelector(".site-footer");
  var background = [main, footer].filter(Boolean);

  function focusables() {
    var links = Array.prototype.slice.call(panel.querySelectorAll("a"));
    return [toggle].concat(links);
  }

  function setBackgroundInert(state) {
    background.forEach(function (el) {
      if (state) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
      else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
    });
  }

  function setMenu(open) {
    if (!toggle || !panel) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    document.body.style.overflow = open ? "hidden" : "";

    if (open) {
      panel.hidden = false;
      setBackgroundInert(true);
      requestAnimationFrame(function () {
        panel.classList.add("open");
        var first = panel.querySelector("a");
        if (first) first.focus();
      });
    } else {
      panel.classList.remove("open");
      setBackgroundInert(false);
      window.setTimeout(function () {
        if (toggle.getAttribute("aria-expanded") === "false") panel.hidden = true;
      }, 400);
    }
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close on link tap and move focus to the targeted section
    panel.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;
      setMenu(false);
      var id = (link.getAttribute("href") || "").replace(/^#/, "");
      var target = id && document.getElementById(id);
      if (target) {
        target.setAttribute("tabindex", "-1");
        window.setTimeout(function () { target.focus({ preventScroll: false }); }, 50);
      } else {
        toggle.focus();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;

      if (e.key === "Escape") {
        setMenu(false);
        toggle.focus();
        return;
      }

      // Focus trap across [toggle, ...links]
      if (e.key === "Tab") {
        var items = focusables();
        if (!items.length) return;
        var firstEl = items[0];
        var lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });
  }
})();
