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
    // Stagger elements that enter together
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    observer.observe(el);
});

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-menu');

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

// Custom cursor (desktop only)
const dot = document.querySelector('.cursor-dot');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function bindCursorHover() {
    if (!fine || reducedMotion) return;
    document.querySelectorAll('a, button, .zoomable').forEach((el) => {
        el.addEventListener('mouseenter', () => dot.classList.add('is-hovering'));
        el.addEventListener('mouseleave', () => dot.classList.remove('is-hovering'));
    });
}

if (fine && !reducedMotion) {
    let x = 0, y = 0, dx = 0, dy = 0;

    window.addEventListener('mousemove', (e) => {
        x = e.clientX;
        y = e.clientY;
        dot.classList.add('is-visible');
    });

    window.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget) dot.classList.remove('is-visible');
    });

    (function follow() {
        dx += (x - dx) * 0.18;
        dy += (y - dy) * 0.18;
        dot.style.transform = `translate(${dx - 7}px, ${dy - 7}px)`;
        requestAnimationFrame(follow);
    })();
}

// Duplicate marquee content so the loop is seamless
const track = document.querySelector('.marquee-track');
track.innerHTML += track.innerHTML;

// Collapsible file sections
const files = document.querySelectorAll('.file');
const fileOrder = ['projects', 'experience', 'about'];
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

function openFirstProjectTab() {
    const anyOpen = [...document.querySelectorAll('.folder-panel')].some((p) =>
        p.classList.contains('is-open')
    );
    const firstTab = document.querySelector('.ftab');
    if (!anyOpen && firstTab) firstTab.click();
}

function revealNextSectionOnScroll() {
    if (reducedMotion) return;

    const triggerY = window.innerHeight * 0.72;

    fileOrder.forEach((id, index) => {
        if (index !== lastRevealedIndex + 1) return;

        const file = document.getElementById(id);
        const tab = file?.querySelector('.section-tab');
        if (!file || !tab || file.dataset.userClosed) return;

        const { top, bottom } = tab.getBoundingClientRect();
        if (top <= triggerY && bottom > 0) {
            setFileOpen(file, true);
            if (id === 'projects') openFirstProjectTab();
            lastRevealedIndex = index;
        }
    });
}

let scrollPending = false;
window.addEventListener(
    'scroll',
    () => {
        if (scrollPending) return;
        scrollPending = true;
        requestAnimationFrame(() => {
            revealNextSectionOnScroll();
            scrollPending = false;
        });
    },
    { passive: true }
);

revealNextSectionOnScroll();

// Opening a file via nav link / URL hash expands it
function openFromHash(hash) {
    const target = hash && document.querySelector(hash + '.file');
    if (target) {
        delete target.dataset.userClosed;
        setFileOpen(target, true);
        if (target.id === 'projects') openFirstProjectTab();
        const index = fileOrder.indexOf(target.id);
        if (index > lastRevealedIndex) lastRevealedIndex = index;
    }
}

document.querySelectorAll('a[href^="#"]').forEach((link) =>
    link.addEventListener('click', () => openFromHash(link.getAttribute('href')))
);

if (location.hash) openFromHash(location.hash);

// Project folder tabs: all collapsed by default, click a tab to expand
const ftabs = document.querySelectorAll('.ftab');
const folderPanels = document.querySelectorAll('.folder-panel');

ftabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        const wasOpen = panel.classList.contains('is-open');

        folderPanels.forEach((p) => {
            p.classList.remove('is-open');
            p.querySelectorAll('video').forEach((v) => v.pause());
        });
        ftabs.forEach((t) => t.setAttribute('aria-expanded', 'false'));

        if (!wasOpen) {
            panel.classList.add('is-open');
            tab.setAttribute('aria-expanded', 'true');
        }
    });
});

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

document.querySelectorAll('.polaroid, .snapshot, .hero-photo').forEach(bindZoomable);
bindCursorHover();
