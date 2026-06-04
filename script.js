document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* =============================================
       1. HEADER — scroll state
    ============================================= */
    const header = document.getElementById('site-header');
    const onScroll = () => {
        if (!header) return;
        header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* =============================================
       2. MOBILE NAV
    ============================================= */
    const navToggle = document.getElementById('nav-toggle');
    const navMenu   = document.getElementById('nav-menu');

    const closeNav = () => {
        navToggle?.classList.remove('is-open');
        navMenu?.classList.remove('is-open');
        navToggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    navToggle?.addEventListener('click', () => {
        const open = !navMenu.classList.contains('is-open');
        navToggle.classList.toggle('is-open', open);
        navMenu.classList.toggle('is-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    });

    navMenu?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeNav);
    });

    /* =============================================
       3. ACTIVE NAV LINK on scroll
    ============================================= */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const setActiveNav = () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) current = section.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    };
    window.addEventListener('scroll', setActiveNav, { passive: true });

    /* =============================================
       4. TYPEWRITER
    ============================================= */
    const sounds = () => window.EstlUiSounds;

    function typeWriter(el, text, speed = 40, callback) {
        if (prefersReducedMotion) {
            el.textContent = text;
            callback?.();
            return;
        }
        el.textContent = '';
        let i = 0;
        let started = false;

        function tick() {
            if (i < text.length) {
                if (!started) {
                    started = true;
                    sounds()?.typeStart?.();
                }
                const ch = text.charAt(i);
                el.textContent += ch;
                sounds()?.typeChar?.(ch, i);
                i++;
                setTimeout(tick, speed);
            } else {
                sounds()?.typeEnd?.();
                callback?.();
            }
        }
        tick();
    }

    const heroTW   = document.getElementById('hero-typewriter');
    const heroCur  = document.getElementById('hero-cursor');
    const heroText = heroTW?.getAttribute('data-text') ?? '';

    if (heroTW && heroText) {
        if (prefersReducedMotion) {
            heroTW.textContent = heroText;
            const sub = document.getElementById('hero-subtitle');
            const subTxt = sub?.getAttribute('data-text') ?? '';
            if (sub) {
                sub.style.visibility = 'visible';
                sub.textContent = subTxt;
            }
            const btns = document.querySelector('.hero-btns');
            if (btns) {
                btns.style.opacity = '1';
                btns.style.transform = 'translateY(0)';
            }
        } else {
            heroCur && (heroCur.style.display = 'inline-block');
            setTimeout(() => {
                typeWriter(heroTW, heroText, 42, () => {
                    const sub    = document.getElementById('hero-subtitle');
                    const subCur = document.getElementById('hero-sub-cursor');
                    const subTxt = sub?.getAttribute('data-text') ?? '';
                    if (sub && subTxt) {
                        sub.style.visibility = 'visible';
                        subCur && (subCur.style.display = 'inline-block');
                        typeWriter(sub, subTxt, 26, () => {
                            const btns = document.querySelector('.hero-btns');
                            if (btns) {
                                btns.style.opacity   = '1';
                                btns.style.transform = 'translateY(0)';
                            }
                        });
                    }
                });
            }, 300);
        }
    }

    /* =============================================
       5. SCROLL ANIMATIONS + scroll typewriters
    ============================================= */
    const scrollObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-visible');
            obs.unobserve(el);

            if (el.classList.contains('typewriter-scroll')) {
                const tw  = el.querySelector('.tw-text');
                const cur = el.querySelector('.tw-cursor');
                const txt = tw?.getAttribute('data-text') ?? '';
                if (tw && txt && !tw.dataset.typed) {
                    tw.dataset.typed = 'true';
                    setTimeout(() => {
                        cur && (cur.style.display = 'inline-block');
                        typeWriter(tw, txt, 32, () => {
                            cur && (cur.style.animation = 'blink 0.8s step-end infinite');
                        });
                    }, 150);
                }
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll, .typewriter-scroll')
        .forEach(el => scrollObserver.observe(el));

    /* =============================================
       6. STAT COUNTERS
    ============================================= */
    const statObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            if (isNaN(target)) return;
            obs.unobserve(el);

            if (prefersReducedMotion) {
                el.textContent = target;
                return;
            }

            const duration = 1600;
            const start = performance.now();
            const animate = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(eased * target);
                if (progress < 1) requestAnimationFrame(animate);
                else el.textContent = target;
            };
            requestAnimationFrame(animate);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(el => statObserver.observe(el));

    /* =============================================
       7. MATRIX RAIN (subtle, disabled on reduced motion)
    ============================================= */
    const canvas = document.getElementById('matrix-canvas');
    if (canvas && !prefersReducedMotion) {
        const ctx = canvas.getContext('2d');
        let W, H, cols, drops, animId;
        const fontSize = 14;

        function initCanvas() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
            cols  = Math.floor(W / fontSize);
            drops = Array(cols).fill(1);
        }

        initCanvas();

        const CHARS = 'アイウエオカキESTLIQ<>/{}[]()=;0123456789';
        let lastFrame = 0;
        const isMobile = () => window.innerWidth < 768;
        const frameDelay = () => isMobile() ? 80 : 55;

        function drawMatrix(timestamp) {
            animId = requestAnimationFrame(drawMatrix);
            if (timestamp - lastFrame < frameDelay()) return;
            lastFrame = timestamp;

            ctx.fillStyle = 'rgba(3,3,3,0.08)';
            ctx.fillRect(0, 0, W, H);
            ctx.font = `${fontSize}px "Share Tech Mono", monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = CHARS[Math.floor(Math.random() * CHARS.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                ctx.fillStyle = Math.random() > 0.96 ? '#00ff41' : '#0a2e14';
                ctx.fillText(char, x, y);
                if (y > H && Math.random() > 0.97) drops[i] = 0;
                drops[i]++;
            }
        }

        drawMatrix(0);

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                cancelAnimationFrame(animId);
                initCanvas();
                lastFrame = 0;
                drawMatrix(0);
            }, 200);
        });
    } else if (canvas) {
        canvas.style.display = 'none';
    }

    /* =============================================
       8. SMOOTH SCROLL
    ============================================= */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const id = anchor.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            }
        });
    });

    /* =============================================
       9. CONTACT FORM
    ============================================= */
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');

    form?.addEventListener('submit', e => {
        e.preventDefault();
        const name    = form.querySelector('#name');
        const email   = form.querySelector('#email');
        const message = form.querySelector('#message');

        if (!name?.value.trim() || !email?.value.trim() || !message?.value.trim()) {
            status.textContent = 'Please fill in all required fields.';
            status.className = 'form-status error';
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            status.textContent = 'Please enter a valid email address.';
            status.className = 'form-status error';
            return;
        }

        status.textContent = 'Thank you! Your message has been received. We will respond shortly.';
        status.className = 'form-status success';
        form.reset();

        setTimeout(() => {
            status.textContent = '';
            status.className = 'form-status';
        }, 6000);
    });

    /* =============================================
       10. BACK TO TOP
    ============================================= */
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (!backToTop) return;
        if (window.scrollY > 500) {
            backToTop.hidden = false;
        } else {
            backToTop.hidden = true;
        }
    }, { passive: true });

    backToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
});
