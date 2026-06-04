/**
 * CS2-inspired UI sounds (Web Audio API)
 * Clean Source-engine style menu clicks — crisp, dry, digital
 */
(function () {
    'use strict';

    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const noop = () => {};
    if (REDUCED_MOTION) {
        window.EstlUiSounds = {
            play: noop, unlock: noop,
            typeChar: noop, typeStart: noop, typeEnd: noop,
        };
        return;
    }

    let ctx = null;
    let unlocked = false;
    let lastPlay = 0;
    let lastType = 0;
    let lastHover = 0;
    const MIN_GAP_MS = 32;
    const TYPE_GAP_MS = 14;
    const HOVER_GAP_MS = 90;

    /* Master volume — CS2 UI is fairly quiet */
    const MASTER = 0.85;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctx;
    }

    function unlock() {
        if (!unlocked) return;
        const audio = getCtx();
        if (audio.state === 'suspended') audio.resume();
    }

    function activateAudio() {
        if (unlocked) return;
        unlocked = true;
        const audio = getCtx();
        if (audio.state === 'suspended') audio.resume();
    }

    function connectMaster(node, start, peak, decay) {
        const audio = node.context;
        const g = audio.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(peak * MASTER, start + 0.001);
        g.gain.exponentialRampToValueAtTime(0.0001, start + decay);
        node.connect(g);
        g.connect(audio.destination);
    }

    /** CS2 rollover — soft high tick */
    function csRoll(audio) {
        const t = audio.currentTime;
        const osc = audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1680, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.012);
        connectMaster(osc, t, 0.045, 0.018);
        osc.start(t);
        osc.stop(t + 0.02);

        const len = Math.floor(audio.sampleRate * 0.006);
        const buf = audio.createBuffer(1, len, audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const n = audio.createBufferSource();
        n.buffer = buf;
        const hp = audio.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 5000;
        n.connect(hp);
        connectMaster(hp, t, 0.025, 0.008);
        n.start(t);
        n.stop(t + 0.01);
    }

    /** CS2 button click — ui/buttonclick style */
    function csClick(audio) {
        const t = audio.currentTime;

        const osc = audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1240, t);
        osc.frequency.exponentialRampToValueAtTime(720, t + 0.028);
        connectMaster(osc, t, 0.1, 0.035);
        osc.start(t);
        osc.stop(t + 0.04);

        const len = Math.floor(audio.sampleRate * 0.014);
        const buf = audio.createBuffer(1, len, audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 1.4;
        const n = audio.createBufferSource();
        n.buffer = buf;
        const bp = audio.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 3800;
        bp.Q.value = 1.2;
        n.connect(bp);
        connectMaster(bp, t, 0.07, 0.016);
        n.start(t);
        n.stop(t + 0.02);
    }

    /** CS2 accept — purchase / confirm */
    function csAccept(audio) {
        const t = audio.currentTime;

        const osc1 = audio.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(980, t);
        osc1.frequency.exponentialRampToValueAtTime(620, t + 0.04);
        connectMaster(osc1, t, 0.11, 0.045);
        osc1.start(t);
        osc1.stop(t + 0.05);

        const osc2 = audio.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1480, t + 0.022);
        osc2.frequency.exponentialRampToValueAtTime(1100, t + 0.05);
        connectMaster(osc2, t + 0.022, 0.06, 0.032);
        osc2.start(t + 0.022);
        osc2.stop(t + 0.055);

        const len = Math.floor(audio.sampleRate * 0.02);
        const buf = audio.createBuffer(1, len, audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const n = audio.createBufferSource();
        n.buffer = buf;
        const hp = audio.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 3200;
        n.connect(hp);
        connectMaster(hp, t, 0.05, 0.022);
        n.start(t);
        n.stop(t + 0.025);
    }

    /** CS2 deny / back — lighter reverse blip */
    function csBack(audio) {
        const t = audio.currentTime;
        const osc = audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, t);
        osc.frequency.exponentialRampToValueAtTime(940, t + 0.03);
        connectMaster(osc, t, 0.08, 0.035);
        osc.start(t);
        osc.stop(t + 0.04);
    }

    /** CS2 console / code typing — per character */
    function csTypeChar(audio, char, index, gainMul = 1) {
        const now = Date.now();
        if (now - lastType < TYPE_GAP_MS) return;
        lastType = now;

        if (char === ' ' && index % 3 !== 0) return;

        const t = audio.currentTime;
        const code = char.charCodeAt(0);
        let freq = 880 + (code % 320);

        if ('.,;:!?'.includes(char)) freq *= 0.78;
        else if ('<>/\\[]{}#&|='.includes(char)) freq = 1180 + (code % 80);
        else if (char >= 'A' && char <= 'Z') freq += 60;
        else if (char >= '0' && char <= '9') freq = 1020 + (code % 120);

        const osc = audio.createOscillator();
        osc.type = index % 4 === 0 ? 'square' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.82, t + 0.01);
        connectMaster(osc, t, 0.038 * gainMul, 0.014);
        osc.start(t);
        osc.stop(t + 0.018);

        const len = Math.floor(audio.sampleRate * 0.008);
        const buf = audio.createBuffer(1, len, audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        }
        const n = audio.createBufferSource();
        n.buffer = buf;
        const hp = audio.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 4200 + (code % 800);
        n.connect(hp);
        connectMaster(hp, t, 0.022 * gainMul, 0.01);
        n.start(t);
        n.stop(t + 0.012);
    }

    /** Backspace in form fields */
    function csInputBack(audio) {
        const t = audio.currentTime;
        const osc = audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.exponentialRampToValueAtTime(340, t + 0.018);
        connectMaster(osc, t, 0.032, 0.02);
        osc.start(t);
        osc.stop(t + 0.022);
    }

    /** Console boot — typewriter sequence starts */
    function csTypeStart(audio) {
        const t = audio.currentTime;
        const osc = audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(1560, t + 0.055);
        connectMaster(osc, t, 0.055, 0.06);
        osc.start(t);
        osc.stop(t + 0.065);

        const len = Math.floor(audio.sampleRate * 0.025);
        const buf = audio.createBuffer(1, len, audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const n = audio.createBufferSource();
        n.buffer = buf;
        const bp = audio.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2400;
        bp.Q.value = 0.8;
        n.connect(bp);
        connectMaster(bp, t, 0.04, 0.03);
        n.start(t);
        n.stop(t + 0.03);
    }

    /** Line complete — soft CS confirm */
    function csTypeEnd(audio) {
        const t = audio.currentTime;
        const osc = audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1120, t);
        osc.frequency.exponentialRampToValueAtTime(780, t + 0.025);
        connectMaster(osc, t, 0.05, 0.028);
        osc.start(t);
        osc.stop(t + 0.032);
    }

    function typeChar(char, index, gainMul = 1) {
        if (!unlocked) return;
        unlock();
        csTypeChar(getCtx(), char, index, gainMul);
    }

    const FIELD_SELECTOR = [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="search"]',
        'input[type="tel"]',
        'input[type="url"]',
        'input:not([type])',
        'textarea',
    ].join(', ');

    function onFieldInput(e) {
        const el = e.target;
        if (!el.matches(FIELD_SELECTOR)) return;
        if (el.dataset.muteSound !== undefined || el.readOnly || el.disabled) return;

        activateAudio();
        if (!unlocked) return;

        const inputType = e.inputType || '';

        if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
            csInputBack(getCtx());
            return;
        }

        if (inputType === 'insertFromPaste' || inputType === 'insertReplacementText') {
            csTypeEnd(getCtx());
            return;
        }

        const data = e.data;
        if (!data) return;

        const gain = 0.7;
        const limit = data.length > 4 ? 5 : data.length;
        for (let i = 0; i < limit; i++) {
            csTypeChar(getCtx(), data.charAt(i), i, gain);
        }
    }

    function onFieldFocus(e) {
        const el = e.target;
        if (!el.matches(FIELD_SELECTOR)) return;
        if (el.dataset.muteSound !== undefined) return;

        activateAudio();
        if (!unlocked) return;

        csRoll(getCtx());
    }

    function typeStart() {
        if (!unlocked) return;
        unlock();
        csTypeStart(getCtx());
    }

    function typeEnd() {
        if (!unlocked) return;
        unlock();
        csTypeEnd(getCtx());
    }

    /** Nav tab — between roll and click */
    function csNav(audio) {
        const t = audio.currentTime;
        const osc = audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1420, t);
        osc.frequency.exponentialRampToValueAtTime(1050, t + 0.02);
        connectMaster(osc, t, 0.065, 0.025);
        osc.start(t);
        osc.stop(t + 0.03);

        const len = Math.floor(audio.sampleRate * 0.01);
        const buf = audio.createBuffer(1, len, audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const n = audio.createBufferSource();
        n.buffer = buf;
        const hp = audio.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 4500;
        n.connect(hp);
        connectMaster(hp, t, 0.035, 0.012);
        n.start(t);
        n.stop(t + 0.015);
    }

    const PRESETS = {
        roll:     (a) => csRoll(a),
        click:    (a) => csClick(a),
        accept:   (a) => csAccept(a),
        back:     (a) => csBack(a),
        nav:      (a) => csNav(a),
        secondary:(a) => csClick(a),
        submit:   (a) => csAccept(a),
    };

    function play(preset) {
        const now = Date.now();
        if (now - lastPlay < MIN_GAP_MS) return;
        lastPlay = now;

        activateAudio();
        unlock();
        (PRESETS[preset] || PRESETS.click)(getCtx());
    }

    function resolvePreset(el) {
        if (el.matches('button[type="submit"]')) return 'submit';
        if (el.classList.contains('back-to-top') || el.classList.contains('nav-toggle')) return 'back';
        if (el.classList.contains('social-icon')) return 'roll';
        if (el.classList.contains('nav-link') || el.closest('.footer-links, .footer-services')) return 'nav';
        if (el.classList.contains('btn-light') || el.hasAttribute('download')) return 'accept';
        if (el.classList.contains('btn-outline')) return 'secondary';
        if (el.classList.contains('btn')) return 'accept';
        if (el.matches('button, .btn')) return 'click';
        return 'nav';
    }

    function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        const el = e.target.closest(
            'a, button, .btn, .nav-link, .nav-toggle, .social-icon, .back-to-top, input[type="submit"]'
        );
        if (!el || el.dataset.muteSound !== undefined) return;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
        play(resolvePreset(el));
    }

    function initUnlock() {
        activateAudio();
    }

    ['pointerdown', 'keydown', 'scroll', 'touchstart', 'click'].forEach((ev) => {
        document.addEventListener(ev, initUnlock, { capture: true, passive: true });
    });
    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });

    /* Typing sounds in form fields */
    document.addEventListener('input', onFieldInput, { capture: true, passive: true });
    document.addEventListener('focusin', onFieldFocus, { capture: true, passive: true });

    /* CS2 menu hover — ui/buttonrollover */
    document.addEventListener('mouseover', (e) => {
        const el = e.target.closest('.btn, .nav-link, .nav-toggle, .back-to-top, .social-icon');
        if (!el) return;
        const now = Date.now();
        if (now - lastHover < HOVER_GAP_MS) return;
        lastHover = now;

        if (!unlocked) return;
        unlock();
        csRoll(getCtx());
    }, { passive: true });

    window.EstlUiSounds = {
        play, unlock: activateAudio, presets: PRESETS,
        typeChar, typeStart, typeEnd,
    };
})();
