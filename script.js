// Scroll-reveal animations
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    observer.observe(el);
});

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-menu');

if (toggle && menu) {
    toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
    });

    menu.querySelectorAll('a').forEach((link) =>
        link.addEventListener('click', () => {
            menu.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        })
    );
}

// Custom cursor (desktop only)
const dot = document.querySelector('.cursor-dot');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function bindCursorHover() {
    if (!fine || reducedMotion || !dot) return;
    document.querySelectorAll('a, button, .zoomable, .vtab, .htab').forEach((el) => {
        el.addEventListener('mouseenter', () => dot.classList.add('is-hovering'));
        el.addEventListener('mouseleave', () => dot.classList.remove('is-hovering'));
    });
}

if (fine && !reducedMotion && dot) {
    let visible = false;

    function moveCursor(x, y) {
        dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        if (!visible) {
            visible = true;
            dot.classList.add('is-visible');
        }
    }

    window.addEventListener('mousemove', (e) => moveCursor(e.clientX, e.clientY), { passive: true });

    if ('onpointerrawupdate' in window) {
        window.addEventListener('pointerrawupdate', (e) => moveCursor(e.clientX, e.clientY));
    }

    window.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget) {
            visible = false;
            dot.classList.remove('is-visible');
        }
    });
}

// Duplicate marquee content so the loop is seamless
const track = document.querySelector('.marquee-track');
if (track) track.innerHTML += track.innerHTML;

// Archive folder tabs (per-section folders with vertical subsection tabs)
const sectionHashes = ['projects', 'experience', 'about', 'contact'];

function isHomepage() {
    return Boolean(document.getElementById('top'));
}

function initArchiveFolder(folder) {
    const vtabs = folder.querySelectorAll('.vtab');
    const tabPanels = folder.querySelectorAll('[data-tab]');
    if (!vtabs.length || !tabPanels.length) return;

    const defaultTab = vtabs[0].dataset.tab;

    function setTab(tabId, { userInitiated = false } = {}) {
        vtabs.forEach((tab) => {
            const active = tab.dataset.tab === tabId;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
        });

        tabPanels.forEach((panel) => {
            const active = panel.dataset.tab === tabId;
            panel.classList.toggle('is-active', active);
            panel.hidden = !active;
        });

        folder.dataset.activeTab = tabId;

        // Dismiss tab hint only when the user explores a non-default project tab.
        if (
            userInitiated &&
            folder.classList.contains('kraft-folder--projects') &&
            tabId !== defaultTab
        ) {
            folder.classList.add('has-used-tabs');
        }
    }

    vtabs.forEach((tab) => {
        tab.addEventListener('click', () => setTab(tab.dataset.tab, { userInitiated: true }));
    });

    folder._resetTab = () => setTab(defaultTab);
}

document.querySelectorAll('.kraft-folder[data-archive]').forEach(initArchiveFolder);

const CUSTOM_TAB_ARROW_KEY = 'portfolio-vtab-arrow-custom';

function applyCustomTabArrow(path, arrow) {
    const raw = localStorage.getItem(CUSTOM_TAB_ARROW_KEY);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        if (!data.pathD) return;

        path.setAttribute('d', data.pathD);
        if (data.durationMs) {
            arrow?.style.setProperty('--vtab-arrow-duration', `${data.durationMs}ms`);
        }
    } catch (_) {
        /* ignore invalid saved stroke */
    }
}

function getVtabArrowDurationMs() {
    const arrow = document.querySelector('.vtab-hint__arrow');
    if (!arrow) return 4000;

    const raw = getComputedStyle(arrow).getPropertyValue('--vtab-arrow-duration').trim();
    if (raw.endsWith('ms')) return parseFloat(raw);
    if (raw.endsWith('s')) return parseFloat(raw) * 1000;
    return 4000;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function setVtabHeadVisible(head, visible) {
    head.style.opacity = visible ? '1' : '0';
}

function placeVtabArrowHead(path, head, progress) {
    const len = path.getTotalLength();
    if (!len || progress <= 0.008) {
        setVtabHeadVisible(head, false);
        return;
    }

    const tipLen = 14;
    const aheadOffset = 3.5;
    const at = progress * len;
    const pt = path.getPointAtLength(at);
    const lookBack = Math.max(0, at - Math.max(2.5, len * 0.035));
    const behind = path.getPointAtLength(lookBack);
    const angleRad = Math.atan2(pt.y - behind.y, pt.x - behind.x);
    const angle = angleRad * (180 / Math.PI);
    const tipX = pt.x + Math.cos(angleRad) * aheadOffset;
    const tipY = pt.y + Math.sin(angleRad) * aheadOffset;
    const tx = tipX - Math.cos(angleRad) * tipLen;
    const ty = tipY - Math.sin(angleRad) * tipLen;

    head.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${angle.toFixed(2)})`);
    setVtabHeadVisible(head, true);
}

function initVtabArrowAnimation() {
    const path = document.querySelector('.vtab-hint__path');
    const head = document.querySelector('.vtab-hint__head');
    const arrow = document.querySelector('.vtab-hint__arrow');
    if (!path || !head || !arrow) return;

    applyCustomTabArrow(path, arrow);

    path.setAttribute('pathLength', '100');
    path.setAttribute('stroke-dasharray', '100');
    setVtabHeadVisible(head, false);

    if (reducedMotion) {
        path.style.strokeDashoffset = '0';
        path.style.opacity = '1';
        placeVtabArrowHead(path, head, 1);
        return;
    }

    const drawMs = getVtabArrowDurationMs();
    const holdMs = 400;
    const resetMs = 320;
    const cycleMs = drawMs + holdMs + resetMs;
    const start = performance.now();
    let animating = true;
    let frameId = 0;

    function frame(now) {
        if (!animating) {
            frameId = 0;
            return;
        }

        const t = (now - start) % cycleMs;

        if (t < drawMs) {
            const eased = easeInOutCubic(t / drawMs);

            path.style.opacity = '1';
            path.style.strokeDashoffset = String(100 - eased * 100);
            placeVtabArrowHead(path, head, eased);
        } else if (t < drawMs + holdMs) {
            path.style.opacity = '1';
            path.style.strokeDashoffset = '0';
            placeVtabArrowHead(path, head, 1);
        } else {
            const resetT = (t - drawMs - holdMs) / resetMs;
            const fade = 1 - easeInOutCubic(Math.min(1, resetT));

            path.style.opacity = String(Math.max(0, fade));
            head.style.opacity = String(Math.max(0, fade));

            if (resetT >= 0.92) {
                path.style.strokeDashoffset = '100';
            } else {
                placeVtabArrowHead(path, head, 1);
            }
        }

        frameId = requestAnimationFrame(frame);
    }

    function setAnimating(active) {
        animating = active;
        if (active && !frameId) {
            frameId = requestAnimationFrame(frame);
        }
        if (!active && frameId) {
            cancelAnimationFrame(frameId);
            frameId = 0;
        }
    }

    const hint = document.querySelector('.vtab-hint');
    if (hint && 'IntersectionObserver' in window) {
        const hintObserver = new IntersectionObserver(
            ([entry]) => setAnimating(entry.isIntersecting && !document.hidden),
            { threshold: 0 }
        );
        hintObserver.observe(hint);
    }

    document.addEventListener('visibilitychange', () => {
        const hintEl = document.querySelector('.vtab-hint');
        if (!hintEl) return;
        const rect = hintEl.getBoundingClientRect();
        const inView = rect.bottom > 0 && rect.top < window.innerHeight;
        setAnimating(inView && !document.hidden);
    });

    frameId = requestAnimationFrame(frame);
}

initVtabArrowAnimation();

const HINT_TEXT_POS_KEY = 'portfolio-vtab-hint-text-position';

function loadHintTextPosition() {
    try {
        const raw = JSON.parse(localStorage.getItem(HINT_TEXT_POS_KEY) || '{}');
        return {
            x: Number(raw.x) || 0,
            y: Number(raw.y) || 0,
        };
    } catch (_) {
        return { x: 0, y: 0 };
    }
}

function applyHintTextPosition(pos = loadHintTextPosition()) {
    const wrap = document.querySelector('.vtab-hint__text-wrap');
    if (!wrap) return;

    wrap.style.setProperty('--hint-text-x', `${pos.x}px`);
    wrap.style.setProperty('--hint-text-y', `${pos.y}px`);
}

function initHintTextPlacement() {
    const hint = document.querySelector('.vtab-hint');
    const wrap = document.querySelector('.vtab-hint__text-wrap');
    if (!hint || !wrap) return;

    applyHintTextPosition();

    const isPlacementMode = new URLSearchParams(location.search).has('place-hint');

    if (isPlacementMode) {
        hint.classList.add('vtab-hint--placing', 'is-in');
        hint.closest('.kraft-folder--projects')?.classList.remove('has-used-tabs');
        document.getElementById('projects')?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }

    let pos = loadHintTextPosition();
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startPosX = 0;
    let startPosY = 0;

    if (isPlacementMode) {
        const bar = document.createElement('div');
        bar.className = 'vtab-hint-placement-bar';
        bar.innerHTML = 'Drag to place <button type="button">Reset</button>';
        hint.appendChild(bar);

        bar.querySelector('button')?.addEventListener('click', () => {
            pos = { x: 0, y: 0 };
            applyHintTextPosition(pos);
            saveHintTextPosition(pos);
        });
    }

    wrap.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        dragging = true;
        wrap.classList.add('is-dragging');
        wrap.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        startPosX = pos.x;
        startPosY = pos.y;
    });

    wrap.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        pos.x = startPosX + (e.clientX - startX);
        pos.y = startPosY + (e.clientY - startY);
        applyHintTextPosition(pos);
    });

    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        wrap.classList.remove('is-dragging');
        saveHintTextPosition(pos);
    };

    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);
}

function saveHintTextPosition(pos) {
    localStorage.setItem(HINT_TEXT_POS_KEY, JSON.stringify(pos));
}

initHintTextPlacement();

function openSectionFromHash(hash) {
    if (!hash) return;
    const section = hash.replace('#', '');
    if (!sectionHashes.includes(section)) return;

    const sectionEl = document.getElementById(section);
    sectionEl?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

    const folder = sectionEl?.querySelector('.kraft-folder[data-archive]');
    folder?._resetTab?.();
}

document.querySelectorAll('a[href*="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.includes('#')) return;
    const hash = '#' + (href.includes('index.html#') ? href.split('#')[1] : href.replace(/^[^#]*#/, ''));
    if (!sectionHashes.some((s) => hash === '#' + s)) return;
    link.addEventListener('click', (e) => {
        if (!isHomepage()) return;
        e.preventDefault();
        history.replaceState(null, '', hash);
        openSectionFromHash(hash);
    });
});

if (location.hash && sectionHashes.includes(location.hash.slice(1))) {
    openSectionFromHash(location.hash);
}

// Collapsible file sections (legacy — none on homepage now)
const files = document.querySelectorAll('.file');
const fileOrder = [];
let lastRevealedIndex = -1;

function setFileOpen(file, open) {
    file.classList.toggle('is-open', open);
    if (!open) file.classList.remove('is-settled');
    const tab = file.querySelector('.section-tab');
    if (tab) tab.setAttribute('aria-expanded', String(open));
}

files.forEach((file) => {
    const content = file.querySelector('.file-content');
    const tab = file.querySelector('.section-tab');
    if (!content || !tab) return;

    tab.setAttribute('role', 'button');
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('aria-expanded', 'false');
    if (content.id) tab.setAttribute('aria-controls', content.id);

    content.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'grid-template-rows' && file.classList.contains('is-open')) {
            file.classList.add('is-settled');
        }
    });

    tab.addEventListener('click', () => {
        const willOpen = !file.classList.contains('is-open');
        if (!willOpen) file.dataset.userClosed = 'true';
        setFileOpen(file, willOpen);
    });
    tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tab.click();
        }
    });
});

function revealNextSectionOnScroll() {
    if (reducedMotion || !files.length) return;

    const triggerY = window.innerHeight * 0.72;

    fileOrder.forEach((id, index) => {
        if (index !== lastRevealedIndex + 1) return;

        const file = document.getElementById(id);
        const tab = file?.querySelector('.section-tab');
        if (!file || !tab || file.dataset.userClosed) return;

        const { top, bottom } = tab.getBoundingClientRect();
        if (top <= triggerY && bottom > 0) {
            setFileOpen(file, true);
            lastRevealedIndex = index;
        }
    });
}

let scrollPending = false;
window.addEventListener(
    'scroll',
    () => {
        if (scrollPending || !files.length) return;
        scrollPending = true;
        requestAnimationFrame(() => {
            revealNextSectionOnScroll();
            scrollPending = false;
        });
    },
    { passive: true }
);

revealNextSectionOnScroll();

// Photo lightbox
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = `
    <figure class="lightbox-frame">
        <button class="lightbox-close" aria-label="Close photo">×</button>
        <img alt="">
        <figcaption class="handwritten"></figcaption>
    </figure>`;
document.body.appendChild(lightbox);

const lbImg = lightbox.querySelector('img');
const lbCaption = lightbox.querySelector('figcaption');
const lbFrame = lightbox.querySelector('.lightbox-frame');
const lbClose = lightbox.querySelector('.lightbox-close');

function openLightbox(src, alt, caption) {
    lbImg.src = src;
    lbImg.alt = alt;
    lbCaption.textContent = caption || '';
    lightbox.classList.add('is-open');
    document.body.classList.add('no-scroll');
}

function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
}

lightbox.addEventListener('click', closeLightbox);
lbFrame.addEventListener('click', (e) => e.stopPropagation());
lbClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});

function bindZoomable(fig) {
    const img = fig.querySelector('img');
    const video = fig.querySelector('video');
    if (video && !img) return;

    const captionEl = fig.querySelector('figcaption');
    const caption = captionEl ? captionEl.textContent : '';
    if (!img) return;

    const src = img.currentSrc || img.src;
    const alt = img.alt;

    fig.classList.add('zoomable');
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('aria-label', alt || caption || 'View image');

    const activate = (e) => {
        e.preventDefault();
        openLightbox(src, alt, caption);
    };

    fig.addEventListener('click', activate);
    fig.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(src, alt, caption);
        }
    });
}

document.querySelectorAll('.polaroid, .snapshot, .hero-photo, .scrap-polaroid').forEach(bindZoomable);

function scrollToProjectPage(pageId) {
    const target = document.getElementById(pageId);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function setActivePageNavLink(nav, pageId) {
    nav.querySelectorAll('.page-nav-link').forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${pageId}`);
    });
}

function initPageNav() {
    const nav = document.querySelector('[data-page-nav]');
    if (!nav) return;

    const pages = nav.closest('.scrapbook-spread')?.querySelectorAll('.scrap-page[id]');
    if (!pages?.length) return;

    pages.forEach((page, index) => {
        const link = document.createElement('a');
        link.className = 'page-nav-link';
        link.href = `#${page.id}`;
        link.textContent = String(index + 1);
        link.setAttribute('aria-label', `Page ${index + 1}`);

        link.addEventListener('click', (e) => {
            e.preventDefault();
            history.replaceState(null, '', `#${page.id}`);
            scrollToProjectPage(page.id);
            setActivePageNavLink(nav, page.id);
        });

        nav.appendChild(link);
    });

    const hashPage = location.hash.startsWith('#page-') ? location.hash.slice(1) : null;
    const initialPage = hashPage && document.getElementById(hashPage) ? hashPage : pages[0].id;
    setActivePageNavLink(nav, initialPage);
}

initPageNav();
if (location.hash.startsWith('#page-')) {
    requestAnimationFrame(() => scrollToProjectPage(location.hash.slice(1)));
}

bindCursorHover();
