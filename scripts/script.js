/*
  ArcBlade Works — Interaction layer
  Vanilla JS, no dependencies. One lerp-smoothed rAF loop for scroll motion,
  IntersectionObserver for reveals, accessible drawer + shop filter.
  Redesigned 2026. Original author: Akash Mannil (C0952939)
*/
(function () {
    "use strict";

    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduceMotion = motionQuery.matches;
    if (motionQuery.addEventListener) {
        motionQuery.addEventListener("change", function (e) { reduceMotion = e.matches; });
    }

    var docEl = document.documentElement;

    /* ---------------------------------------------------------
       Mobile menu — accessible drawer
       --------------------------------------------------------- */
    var header = document.querySelector(".site-header");
    var menuToggle = document.getElementById("menuToggle");

    function setMenu(open) {
        if (!header || !menuToggle) return;
        header.classList.toggle("menu-open", open);
        menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
        menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.style.overflow = open ? "hidden" : "";
    }
    function menuIsOpen() { return !!header && header.classList.contains("menu-open"); }

    function setupMenu() {
        if (!menuToggle) return;
        menuToggle.addEventListener("click", function () { setMenu(!menuIsOpen()); });

        /* close on link tap, Escape (focus returns to the button), or outside click */
        document.querySelectorAll(".nav-list a").forEach(function (a) {
            a.addEventListener("click", function () { setMenu(false); });
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && menuIsOpen()) {
                setMenu(false);
                menuToggle.focus();
            }
        });
        document.addEventListener("click", function (e) {
            if (menuIsOpen() && header && !header.contains(e.target)) setMenu(false);
        });
    }

    /* ---------------------------------------------------------
       Scroll reveal — gentle rise, staggered inside grids
       --------------------------------------------------------- */
    function setupReveals() {
        if (reduceMotion || !("IntersectionObserver" in window)) return;

        var selector = [
            "main > section", "main > article", "main > aside", "main > div",
            ".p-card", ".tile", ".t-card", ".team-member", ".faq-item",
            "tbody tr", ".reveal", "[data-reveal]"
        ].join(",");

        var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
        nodes.forEach(function (n) {
            if (!n.classList.contains("no-reveal")) n.classList.add("reveal");
        });

        /* stagger children of any container marked data-stagger */
        document.querySelectorAll("[data-stagger]").forEach(function (grid) {
            Array.prototype.slice.call(grid.children).forEach(function (child, i) {
                child.style.setProperty("--reveal-delay", (Math.min(i, 7) * 70) + "ms");
            });
        });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in");
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

        nodes.forEach(function (n) { io.observe(n); });
    }

    /* ---------------------------------------------------------
       Lerp-smoothed scroll motion.
       Targets update on scroll; a single rAF loop eases the
       rendered values toward them and sleeps once settled.
       --------------------------------------------------------- */
    var progress = document.getElementById("scrollProgress");
    var parallaxEls = [];
    var bladeEls = [];
    var smoothY = 0;
    var rafId = null;

    function collectMotionTargets() {
        parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"))
            .map(function (el) { return { el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0.1, cur: 0 }; });
        bladeEls = Array.prototype.slice.call(document.querySelectorAll("[data-blade]"))
            .map(function (el) { return { el: el, cur: 0 }; });
    }

    function motionFrame() {
        var y = window.pageYOffset || docEl.scrollTop;
        var max = (docEl.scrollHeight - window.innerHeight) || 1;
        var settled = true;

        /* progress bar + header state track raw scroll (cheap, no easing needed) */
        if (progress) progress.style.transform = "scaleX(" + Math.min(y / max, 1) + ")";
        if (header) header.classList.toggle("scrolled", y > 24);

        if (!reduceMotion) {
            /* ease the shared scroll value — this is what makes motion feel smooth */
            smoothY += (y - smoothY) * 0.12;
            if (Math.abs(y - smoothY) > 0.1) settled = false; else smoothY = y;

            for (var i = 0; i < parallaxEls.length; i++) {
                var p = parallaxEls[i];
                var rect = p.el.getBoundingClientRect();
                if (rect.bottom < -80 || rect.top > window.innerHeight + 80) continue;
                var target = (rect.top + rect.height / 2 - window.innerHeight / 2) * -p.speed;
                p.cur += (target - p.cur) * 0.14;
                if (Math.abs(target - p.cur) > 0.1) settled = false;
                p.el.style.transform = "translate3d(0," + p.cur.toFixed(2) + "px,0)";
            }
            for (var j = 0; j < bladeEls.length; j++) {
                var b = bladeEls[j];
                var rot = smoothY * 0.05;
                if (Math.abs(rot - b.cur) > 0.05) settled = false;
                b.cur = rot;
                b.el.style.transform = "rotate(" + rot.toFixed(2) + "deg)";
            }
        }

        if (settled) { rafId = null; } else { rafId = window.requestAnimationFrame(motionFrame); }
    }

    function wakeMotion() {
        if (rafId === null) rafId = window.requestAnimationFrame(motionFrame);
    }

    /* ---------------------------------------------------------
       Heavy <video> — only attach the source on first play
       --------------------------------------------------------- */
    function setupLazyVideo() {
        document.querySelectorAll("video[data-lazy-src]").forEach(function (video) {
            var loaded = false;
            video.addEventListener("play", function () {
                if (loaded) return;
                loaded = true;
                var src = document.createElement("source");
                src.src = video.getAttribute("data-lazy-src");
                src.type = video.getAttribute("data-lazy-type") || "video/mp4";
                video.appendChild(src);
                video.load();
                video.play();
            });
        });
    }

    /* ---------------------------------------------------------
       Shop filter — aria-pressed chips show/hide product cards
       --------------------------------------------------------- */
    function setupShopFilter() {
        var bar = document.querySelector("[data-filterbar]");
        if (!bar) return;
        var buttons = Array.prototype.slice.call(bar.querySelectorAll("button[data-filter]"));
        var cards = Array.prototype.slice.call(document.querySelectorAll(".p-grid [data-cat]"));
        var status = document.getElementById("filterStatus");

        buttons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var filter = btn.getAttribute("data-filter");
                buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });

                var shown = 0;
                cards.forEach(function (card) {
                    var show = filter === "all" || card.getAttribute("data-cat") === filter;
                    card.hidden = !show;
                    if (show) {
                        shown++;
                        /* replay the entrance so filtering feels alive */
                        if (!reduceMotion) {
                            card.classList.remove("in");
                            void card.offsetWidth;
                            card.classList.add("in");
                        }
                    }
                });
                if (status) {
                    status.textContent = shown + (shown === 1 ? " product" : " products") +
                        (filter === "all" ? "" : " in " + btn.textContent.trim());
                }
            });
        });
    }

    /* ---------------------------------------------------------
       Init
       --------------------------------------------------------- */
    function init() {
        setupMenu();
        setupReveals();
        setupLazyVideo();
        setupShopFilter();
        collectMotionTargets();

        window.addEventListener("scroll", wakeMotion, { passive: true });
        window.addEventListener("resize", wakeMotion);
        wakeMotion();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
