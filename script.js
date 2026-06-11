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

if (fine && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

    document.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('mouseenter', () => dot.classList.add('is-hovering'));
        el.addEventListener('mouseleave', () => dot.classList.remove('is-hovering'));
    });
}

// Duplicate marquee content so the loop is seamless
const track = document.querySelector('.marquee-track');
track.innerHTML += track.innerHTML;

// Collapsible file sections
const files = document.querySelectorAll('.file');

files.forEach((file) => {
    const content = file.querySelector('.file-content');

    content.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'grid-template-rows' && file.classList.contains('is-open')) {
            file.classList.add('is-settled');
        }
    });
});

function setOpen(file, open) {
    file.classList.toggle('is-open', open);
    if (!open) file.classList.remove('is-settled');
}

// Auto-open files as their headers scroll into view
const fileObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setOpen(entry.target, true);
                fileObserver.unobserve(entry.target);
            }
        });
    },
    // trigger when the header reaches the upper two-thirds of the viewport
    { rootMargin: '0px 0px -38% 0px' }
);

files.forEach((file) => fileObserver.observe(file));

// Opening a file via nav link / URL hash expands it
function openFromHash(hash) {
    const target = hash && document.querySelector(hash + '.file');
    if (target) setOpen(target, true);
}

document.querySelectorAll('a[href^="#"]').forEach((link) =>
    link.addEventListener('click', () => openFromHash(link.getAttribute('href')))
);

if (location.hash) openFromHash(location.hash);
