/* Drag + rotate paperclips / binder clips. Add ?edit-scraps=1 to any page. */

const SCRAP_STORAGE_KEY = 'portfolio-scrap-positions-v1';
const editScraps = new URLSearchParams(location.search).has('edit-scraps');
const POSITION_KEYS = ['top', 'right', 'bottom', 'left', 'width', 'zIndex'];

function getScrapElements() {
    return document.querySelectorAll('[data-scrap-id]');
}

function loadScrapPositions() {
    try {
        return JSON.parse(localStorage.getItem(SCRAP_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveScrapPositions(data) {
    try {
        localStorage.setItem(SCRAP_STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Could not save scrap positions:', error);
        return false;
    }
}

function parseRotation(transform) {
    if (!transform || transform === 'none') return 0;
    const match = transform.match(/rotate\(([-\d.]+)deg\)/);
    if (match) return parseFloat(match[1]);
    const matrix = new DOMMatrix(transform);
    return Math.round((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI);
}

function normalizeEdgeValue(value) {
    if (!value || value === 'auto' || value === '0px') return 'auto';
    return value;
}

function applyScrapPosition(el, pos) {
    if (!pos) return;

    ['top', 'right', 'bottom', 'left'].forEach((key) => {
        el.style[key] = normalizeEdgeValue(pos[key]);
    });

    ['width', 'zIndex'].forEach((key) => {
        const cssKey = key === 'zIndex' ? 'z-index' : key;
        if (pos[key] != null && pos[key] !== '') {
            el.style.setProperty(cssKey, pos[key]);
        }
    });

    if (pos.transform) el.style.transform = pos.transform;
    el.dataset.scrapLocked = 'true';
}

function captureScrapPosition(el) {
    const cs = getComputedStyle(el);
    const rotation = parseRotation(el.style.transform || cs.transform);
    const pos = { transform: `rotate(${rotation}deg)` };

    ['top', 'right', 'bottom', 'left', 'width'].forEach((key) => {
        const inline = el.style[key];
        const computed = cs[key];
        pos[key] = normalizeEdgeValue(inline || computed);
    });

    if (cs.zIndex !== 'auto') pos.zIndex = el.style.zIndex || cs.zIndex;

    return pos;
}

function captureAllScrapPositions() {
    const data = {};
    getScrapElements().forEach((el) => {
        data[el.dataset.scrapId] = captureScrapPosition(el);
    });
    return data;
}

function mergeScrapPositions(pagePositions) {
    return { ...loadScrapPositions(), ...pagePositions };
}

function exportScrapCss(positions) {
    const lines = ['/* Locked scrap positions — paste into styles.css / scrapbook-patterns.css */', ''];
    Object.entries(positions).forEach(([id, pos]) => {
        lines.push(`[data-scrap-id="${id}"] {`);
        ['top', 'right', 'bottom', 'left', 'width', 'zIndex', 'transform'].forEach((key) => {
            const cssKey = key === 'zIndex' ? 'z-index' : key;
            if (pos[key] != null && pos[key] !== '' && pos[key] !== 'auto') {
                lines.push(`    ${cssKey}: ${pos[key]};`);
            }
        });
        lines.push('}', '');
    });
    return lines.join('\n');
}

function showScrapToast(message) {
    let toast = document.querySelector('.scrap-editor-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'scrap-editor-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showScrapToast._timer);
    showScrapToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function initScrapPositions() {
    if (!editScraps) return;

    const saved = loadScrapPositions();
    getScrapElements().forEach((el) => {
        if (saved[el.dataset.scrapId]) applyScrapPosition(el, saved[el.dataset.scrapId]);
    });
}

function lockScrapPositions() {
    const pagePositions = captureAllScrapPositions();
    const merged = mergeScrapPositions(pagePositions);
    const saved = saveScrapPositions(merged);

    getScrapElements().forEach((el) => {
        if (merged[el.dataset.scrapId]) applyScrapPosition(el, merged[el.dataset.scrapId]);
    });

    const count = Object.keys(pagePositions).length;
    if (!saved) {
        showScrapToast('Save failed — browser may be blocking storage. Use Copy CSS instead.');
        return merged;
    }

    showScrapToast(`Saved ${count} clip${count === 1 ? '' : 's'} on this page (${Object.keys(merged).length} total).`);
    return merged;
}

function initScrapEditor() {
    if (!editScraps) return;

    document.body.classList.add('scrap-editor-active');

    const panel = document.createElement('div');
    panel.className = 'scrap-editor-panel';
    panel.innerHTML = `
        <strong>Scrap editor</strong>
        <span class="scrap-editor-hint">Drag to move · Scroll on a clip to rotate · Click a clip to select</span>
        <span class="scrap-editor-selected">Selected: none</span>
        <button type="button" class="scrap-editor-primary" data-action="lock">Lock positions</button>
        <button type="button" data-action="copy">Copy CSS</button>
        <button type="button" data-action="reset">Reset</button>
        <button type="button" data-action="exit">Exit</button>
    `;
    document.body.appendChild(panel);

    const selectedLabel = panel.querySelector('.scrap-editor-selected');
    let selected = null;
    let dragState = null;

    function selectScrap(el) {
        getScrapElements().forEach((node) => node.classList.remove('is-scrap-selected'));
        selected = el;
        if (el) {
            el.classList.add('is-scrap-selected');
            selectedLabel.textContent = `Selected: ${el.dataset.scrapId}`;
        } else {
            selectedLabel.textContent = 'Selected: none';
        }
    }

    function startDrag(el, clientX, clientY) {
        const parent = el.offsetParent || document.body;
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const rotation = parseRotation(getComputedStyle(el).transform);

        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.left = `${elRect.left - parentRect.left}px`;
        el.style.top = `${elRect.top - parentRect.top}px`;
        el.style.transform = `rotate(${rotation}deg)`;

        dragState = {
            el,
            parentRect,
            offsetX: clientX - elRect.left,
            offsetY: clientY - elRect.top,
            rotation,
        };
        el.classList.add('is-scrap-dragging');
        selectScrap(el);
    }

    function onPointerMove(e) {
        if (!dragState) return;
        const { el, parentRect, offsetX, offsetY, rotation } = dragState;
        const left = e.clientX - parentRect.left - offsetX;
        const top = e.clientY - parentRect.top - offsetY;
        el.style.left = `${Math.round(left)}px`;
        el.style.top = `${Math.round(top)}px`;
        el.style.transform = `rotate(${rotation}deg)`;
    }

    function endDrag() {
        if (!dragState) return;
        dragState.el.classList.remove('is-scrap-dragging');
        dragState = null;
    }

    getScrapElements().forEach((el) => {
        el.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            startDrag(el, e.clientX, e.clientY);
        });

        el.addEventListener('pointermove', (e) => {
            if (!dragState || dragState.el !== el) return;
            onPointerMove(e);
        });

        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', endDrag);

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectScrap(el);
        });

        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            const step = e.shiftKey ? 0.5 : 2;
            const delta = e.deltaY > 0 ? step : -step;
            const rotation = parseRotation(getComputedStyle(el).transform) + delta;
            el.style.transform = `rotate(${rotation}deg)`;
            selectScrap(el);
        }, { passive: false });
    });

    document.addEventListener('click', () => selectScrap(null));

    panel.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        if (action === 'lock') {
            lockScrapPositions();
        }

        if (action === 'copy') {
            const merged = mergeScrapPositions(captureAllScrapPositions());
            const css = exportScrapCss(merged);
            navigator.clipboard.writeText(css).then(() => {
                showScrapToast('All saved CSS copied — send it to lock in permanently.');
            }).catch(() => {
                console.log(css);
                showScrapToast('CSS logged to console (clipboard blocked).');
            });
        }

        if (action === 'reset') {
            localStorage.removeItem(SCRAP_STORAGE_KEY);
            getScrapElements().forEach((el) => {
                el.removeAttribute('style');
                delete el.dataset.scrapLocked;
            });
            showScrapToast('Reset this page — reload to restore defaults.');
        }

        if (action === 'exit') {
            lockScrapPositions();
            const url = new URL(location.href);
            url.searchParams.delete('edit-scraps');
            location.href = url.toString();
        }
    });
}

initScrapPositions();
initScrapEditor();
