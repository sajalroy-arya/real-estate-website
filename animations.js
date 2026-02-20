/* ============================================
   ANIMATIONS.JS — This Website Can Be Yours
   Performance-optimized. Touch-aware.
   ============================================ */

(function () {
    'use strict';

    /* ─── DEVICE DETECTION ─── */
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isMobile = window.innerWidth <= 768;

    /* ─── RAF SCROLL THROTTLE (shared) ─── */
    let scrollRAF = null;
    function onScrollThrottled(fn) {
        window.addEventListener('scroll', () => {
            if (scrollRAF) return;
            scrollRAF = requestAnimationFrame(() => { fn(); scrollRAF = null; });
        }, { passive: true });
    }

    /* ─────────────────────────────────────────
       1. SCROLL PROGRESS BAR
    ───────────────────────────────────────── */
    function initScrollProgress() {
        const bar = document.createElement('div');
        bar.id = 'scroll-progress';
        document.body.prepend(bar);

        onScrollThrottled(() => {
            const total = document.documentElement.scrollHeight - window.innerHeight;
            if (total <= 0) return;
            bar.style.width = Math.min((window.scrollY / total) * 100, 100) + '%';
        });
    }

    /* ─────────────────────────────────────────
       2. CURSOR (desktop only — no RAF on mobile)
    ───────────────────────────────────────── */
    function initCursor() {
        if (!isDesktop) return; // skip entirely on touch/mobile

        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (!dot || !ring) return;

        let mx = 0, my = 0, rx = 0, ry = 0;
        let magX = 0, magY = 0;
        let cursorRAF = null;

        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
            if (!cursorRAF) {
                cursorRAF = requestAnimationFrame(function lerpRing() {
                    rx += (mx + magX - rx) * 0.1;
                    ry += (my + magY - ry) * 0.1;
                    ring.style.left = rx + 'px';
                    ring.style.top = ry + 'px';
                    cursorRAF = requestAnimationFrame(lerpRing);
                });
            }
        }, { passive: true });

        // Magnetic pull
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('link-hover');
                const r = el.getBoundingClientRect();
                const dx = (r.left + r.width / 2) - mx;
                const dy = (r.top + r.height / 2) - my;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 100) { magX = dx * 0.22; magY = dy * 0.22; }
            });
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('link-hover');
                magX = 0; magY = 0;
            });
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.add('clicking');
            ring.style.transform = 'translate(-50%,-50%) scale(0.7)';
        }, { passive: true });
        document.addEventListener('mouseup', () => {
            document.body.classList.remove('clicking');
            ring.style.transform = 'translate(-50%,-50%) scale(1)';
        }, { passive: true });

        // Hide/show on window leave/enter
        document.addEventListener('mouseleave', () => {
            dot.style.opacity = '0'; ring.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            dot.style.opacity = '1'; ring.style.opacity = '.45';
        });
    }

    /* ─────────────────────────────────────────
       3. RIPPLE ON CLICK
    ───────────────────────────────────────── */
    function initRipple() {
        if (prefersReduced) return;
        document.querySelectorAll(
            '.btn-solid,.btn-ghost,.btn-pill,.btn-cta,.btn-gold,.btn-submit,.btn-banner,.btn-dark-sm,.nav-cta'
        ).forEach(el => {
            el.addEventListener('pointerdown', function (e) {
                const r = this.getBoundingClientRect();
                const size = Math.max(r.width, r.height) * 1.6;
                const x = (e.clientX - r.left) - size / 2;
                const y = (e.clientY - r.top) - size / 2;
                const rpl = document.createElement('span');
                rpl.className = 'ripple';
                rpl.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
                this.appendChild(rpl);
                rpl.addEventListener('animationend', () => rpl.remove(), { once: true });
            }, { passive: true });
        });
    }

    /* ─────────────────────────────────────────
       4. COUNTER ANIMATION
    ───────────────────────────────────────── */
    function initCounters() {
        const els = document.querySelectorAll('.stat-num, .stat-val');
        if (!els.length) return;

        function parseNum(s) {
            const m = s.match(/[\d.]+/);
            return m ? parseFloat(m[0]) : null;
        }

        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                obs.unobserve(entry.target);
                const el = entry.target;
                const raw = el.textContent;
                const end = parseNum(raw);
                if (end === null) return;
                const pre = raw.match(/^[^0-9]*/)[0];
                const suf = raw.match(/[^0-9.]*$/)[0];
                const dec = raw.includes('.') ? 1 : 0;
                const dur = isMobile ? 900 : 1400;
                const t0 = performance.now();

                (function tick(now) {
                    const p = Math.min((now - t0) / dur, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    el.textContent = pre + (end * ease).toFixed(dec) + suf;
                    if (p < 1) requestAnimationFrame(tick);
                })(t0);
            });
        }, { threshold: 0.6 });

        els.forEach(el => obs.observe(el));
    }

    /* ─────────────────────────────────────────
       5. 3D CARD TILT (desktop only)
    ───────────────────────────────────────── */
    function initCardTilt() {
        if (!isDesktop || prefersReduced) return;

        document.querySelectorAll('.listing-card,.testi-card,.cred-card,.trust-card').forEach(card => {
            const MAX = 7;
            let tiltRAF = null;
            let lastRx = 0, lastRy = 0;

            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                lastRx = -y * MAX;
                lastRy = x * MAX;
                if (!tiltRAF) {
                    tiltRAF = requestAnimationFrame(() => {
                        card.style.transform = `perspective(900px) rotateX(${lastRx}deg) rotateY(${lastRy}deg) translateY(-6px) scale(1.008)`;
                        card.style.boxShadow = `${-lastRy * 1.2}px ${lastRx * 1.2 + 10}px 44px rgba(28,43,45,.13)`;
                        card.style.transition = 'box-shadow .08s';
                        tiltRAF = null;
                    });
                }
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                if (tiltRAF) { cancelAnimationFrame(tiltRAF); tiltRAF = null; }
                card.style.transform = '';
                card.style.boxShadow = '';
                card.style.transition = 'transform .4s ease, box-shadow .4s ease';
            });
        });
    }

    /* ─────────────────────────────────────────
       6. HERO TEXT CHAR SPLIT (desktop only)
    ───────────────────────────────────────── */
    function initHeroTextSplit() {
        if (isMobile || prefersReduced) return;
        const heading = document.querySelector('.hero-heading');
        if (!heading) return;

        const lines = heading.innerHTML.split(/<br\s*\/?>/i);
        let idx = 0;

        heading.innerHTML = lines.map(line => {
            const isEm = /^<em>/i.test(line.trim());
            const text = line.replace(/<[^>]+>/g, '').trim();
            const chars = text.split('').map(ch => {
                if (ch === ' ') { idx++; return ' '; }
                const d = (0.38 + idx * 0.026).toFixed(3);
                idx++;
                return `<span class="char" style="animation-delay:${d}s">${ch === '.' ? '.' : ch}</span>`;
            }).join('');
            return `<span class="word">${isEm ? `<em>${chars}</em>` : chars}</span>`;
        }).join('<br/>');
    }

    /* ─────────────────────────────────────────
       7. PARALLAX HERO (desktop only)
    ───────────────────────────────────────── */
    function initParallax() {
        if (isMobile || isTouchDevice || prefersReduced) return;
        const img = document.querySelector('.hero-bg img');
        if (!img) return;
        img.style.willChange = 'transform';

        onScrollThrottled(() => {
            img.style.transform = `translateY(${window.scrollY * 0.32}px) translateZ(0)`;
        });
    }

    /* ─────────────────────────────────────────
       8. FLOATING CTA
    ───────────────────────────────────────── */
    function initFloatingCTA() {
        const wrap = document.createElement('div');
        wrap.id = 'floating-cta';
        wrap.innerHTML = `<a href="#cta"><span class="dot"></span>Claim This Site</a>`;
        document.body.appendChild(wrap);

        let shown = false;
        const threshold = window.innerHeight * 0.55;

        onScrollThrottled(() => {
            const show = window.scrollY > threshold;
            if (show === shown) return;
            shown = show;
            wrap.classList.toggle('visible', show);
        });

        const cta = document.getElementById('cta');
        if (cta) {
            const obs = new IntersectionObserver(e => {
                wrap.style.opacity = e[0].isIntersecting ? '0' : '';
                wrap.style.pointerEvents = e[0].isIntersecting ? 'none' : '';
            });
            obs.observe(cta);
        }
    }

    /* ─────────────────────────────────────────
       9. SCROLL FADE-IN (all elements)
    ───────────────────────────────────────── */
    function initFadeIns() {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

        document.querySelectorAll('.fade-in, .fade-from-left, .fade-from-right').forEach(el => obs.observe(el));
    }

    /* ─────────────────────────────────────────
       10. GOLD LINE REVEAL
    ───────────────────────────────────────── */
    function initGoldLines() {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.gold-line').forEach(el => obs.observe(el));
    }

    /* ─────────────────────────────────────────
       11. PAGE TRANSITIONS
    ───────────────────────────────────────── */
    function initPageTransitions() {
        if (prefersReduced) return;
        const overlay = document.createElement('div');
        overlay.id = 'page-transition';
        document.body.prepend(overlay);

        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || link.target === '_blank') return;

            link.addEventListener('click', e => {
                e.preventDefault();
                overlay.style.opacity = '1';
                setTimeout(() => { window.location.href = href; }, 340);
            });
        });
    }

    /* ─────────────────────────────────────────
       12. FILTER BUTTON ANIMATION
    ───────────────────────────────────────── */
    function initFilterAnimations() {
        const grid = document.querySelector('.grid');
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (!grid) return;
                grid.style.opacity = '0';
                grid.style.transform = 'translateY(6px)';
                grid.style.transition = 'opacity .22s,transform .22s';
                setTimeout(() => {
                    grid.style.opacity = '1';
                    grid.style.transform = 'none';
                }, 250);
            });
        });
    }

    /* ─────────────────────────────────────────
       13. IMAGE LAZY LOAD (add loading attr)
    ───────────────────────────────────────── */
    function initLazyImages() {
        document.querySelectorAll('img:not([loading])').forEach((img, i) => {
            // First 2 images eager, rest lazy
            img.setAttribute('loading', i < 2 ? 'eager' : 'lazy');
            img.setAttribute('decoding', 'async');
        });
    }

    /* ─────────────────────────────────────────
       14. MOBILE NAV — close on scroll
    ───────────────────────────────────────── */
    function initMobileNavAutoClose() {
        const mobileNav = document.getElementById('mobileNav');
        if (!mobileNav) return;
        let lastY = 0;
        onScrollThrottled(() => {
            if (!mobileNav.classList.contains('open')) return;
            if (Math.abs(window.scrollY - lastY) > 40) {
                mobileNav.classList.remove('open');
            }
            lastY = window.scrollY;
        });
    }

    /* ─────────────────────────────────────────
       15. CONTACT FORM SUCCESS
    ───────────────────────────────────────── */
    function initContactForm() {
        const form = document.getElementById('contactForm');
        const success = document.getElementById('formSuccess');
        if (!form || !success) return;
        form.addEventListener('submit', e => {
            e.preventDefault();
            form.style.cssText = 'opacity:0;transition:opacity .3s;pointer-events:none';
            setTimeout(() => {
                form.style.display = 'none';
                success.style.display = 'block';
                success.style.opacity = '0';
                requestAnimationFrame(() => {
                    success.style.transition = 'opacity .4s';
                    success.style.opacity = '1';
                });
            }, 320);
        });
    }

    /* ─────────────────────────────────────────
       16. TESTIMONIAL SCROLL SETUP
    ───────────────────────────────────────── */
    function initTestimonials() {
        const track = document.getElementById('testiTrack');
        if (!track) return;
        // Add animate class after a tiny delay so layout is ready
        setTimeout(() => track.classList.add('animate'), 400);
        // Pause on touch
        track.addEventListener('touchstart', () => track.style.animationPlayState = 'paused', { passive: true });
        track.addEventListener('touchend', () => track.style.animationPlayState = 'running', { passive: true });
    }

    /* ─────────────────────────────────────────
       NAV (nav scroll class)
    ───────────────────────────────────────── */
    function initNav() {
        const nav = document.getElementById('navbar');
        if (!nav) return;
        onScrollThrottled(() => nav.classList.toggle('scrolled', window.scrollY > 60));
    }

    /* ─────────────────────────────────────────
       INIT
    ───────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        initScrollProgress();
        initCursor();
        initRipple();
        initCounters();
        initCardTilt();
        initHeroTextSplit();
        initParallax();
        initFloatingCTA();
        initFadeIns();
        initGoldLines();
        initPageTransitions();
        initFilterAnimations();
        initLazyImages();
        initMobileNavAutoClose();
        initContactForm();
        initTestimonials();
        initNav();
    });

})();
