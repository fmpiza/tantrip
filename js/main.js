/* =====================================================================
   COMPASS — main.js · vanilla JS, zero dependencies, no libraries
   Every init guard-clauses missing elements.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header ---------- */
  function initStickyHeader() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("navMenu");
    if (!toggle || !menu) return;

    var close = function () {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    var open = function () {
      menu.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    };

    toggle.addEventListener("click", function () {
      if (menu.classList.contains("open")) { close(); } else { open(); }
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { close(); }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 940) { close(); }
    });
  }

  /* ---------- Smooth scroll (respects reduced motion) ---------- */
  function scrollToTarget(target) {
    var header = document.getElementById("siteHeader");
    var offset = (header ? header.offsetHeight : 0) + 14;
    var top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    if (!links.length) return;
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id === "#" || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        scrollToTarget(target);
      });
    });
  }

  /* ---------- Find-a-trip: scroll to trips on submit ---------- */
  function initFinder() {
    var finder = document.getElementById("finder");
    if (!finder) return;
    finder.addEventListener("submit", function (e) {
      e.preventDefault();
      var tours = document.getElementById("tours");
      if (tours) scrollToTarget(tours);
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    var format = function (value, target) {
      var decimals = (String(target).split(".")[1] || "").length;
      return value.toFixed(decimals);
    };

    var run = function (node) {
      var target = parseFloat(node.getAttribute("data-count"));
      if (isNaN(target)) return;
      var valEl = node.querySelector(".val");
      if (!valEl) return;
      if (reduceMotion) { valEl.textContent = format(target, target); return; }
      var start = null;
      var dur = 1400;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        valEl.textContent = format(target * eased, target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) { nodes.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Reviews slider (scroll-snap + buttons) ---------- */
  function initSlider() {
    var track = document.getElementById("rTrack");
    var prev = document.getElementById("rPrev");
    var next = document.getElementById("rNext");
    if (!track || !prev || !next) return;

    var step = function () {
      var first = track.querySelector(".review");
      if (!first) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 0;
      return first.getBoundingClientRect().width + gap;
    };

    var update = function () {
      var maxScroll = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll;
    };

    prev.addEventListener("click", function () {
      track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    next.addEventListener("click", function () {
      track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Enquiry form validation ---------- */
  function initForm() {
    var form = document.getElementById("enquiryForm");
    if (!form) return;
    var ok = document.getElementById("formOk");

    var setInvalid = function (field, bad) {
      if (!field) return;
      field.classList.toggle("invalid", bad);
    };

    var validateField = function (input) {
      var field = input.closest(".field");
      var value = (input.value || "").trim();
      var bad = false;
      if (input.hasAttribute("required") && !value) bad = true;
      if (!bad && input.type === "email" && value) {
        bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      setInvalid(field, bad);
      return !bad;
    };

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("invalid")) validateField(input);
      });
      input.addEventListener("change", function () { validateField(input); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var firstBad = null;
      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        var good = validateField(input);
        if (!good && !firstBad) firstBad = input;
        if (!good) valid = false;
      });
      if (!valid) {
        if (firstBad) firstBad.focus();
        if (ok) ok.classList.remove("show");
        return;
      }
      form.reset();
      if (ok) {
        ok.classList.add("show");
        ok.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });
  }

  /* ---------- Scrollspy: active nav link ---------- */
  function initScrollSpy() {
    var links = document.querySelectorAll(".nav-links a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          var active = map[entry.target.id];
          if (active) active.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initStickyHeader();
    initMobileNav();
    initSmoothScroll();
    initFinder();
    initReveal();
    initCounters();
    initSlider();
    initForm();
    initScrollSpy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
