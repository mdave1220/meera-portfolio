/* Adjust compact stat circle size + spacing. Add ?edit-stats=1 to any project page. */

const STAT_DEFAULTS = { size: 5.75, gap: 0.9, boxWidth: 89 };
const editStats = new URLSearchParams(location.search).has('edit-stats');

function currentStatProject() {
    const main = document.querySelector('.project-page.scrapbook');
    if (!main) return null;
    if (main.classList.contains('scrapbook--serve')) return 'serve';
    if (main.classList.contains('scrapbook--28ish')) return '28ish';
    if (main.classList.contains('scrapbook--traveljam')) return 'traveljam';
    if (main.classList.contains('scrapbook--kindly')) return 'kindly';
    return null;
}

function statStorageKey() {
    const project = currentStatProject();
    return project ? `portfolio-stat-compact-${project}-v1` : 'portfolio-stat-compact-v1';
}

function getStatStickerRow() {
    return document.querySelector('.scrap-stickers--compact');
}

function loadStatSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(statStorageKey()) || 'null');
        return saved ? { ...STAT_DEFAULTS, ...saved } : { ...STAT_DEFAULTS };
    } catch {
        return { ...STAT_DEFAULTS };
    }
}

function saveStatSettings(settings) {
    try {
        localStorage.setItem(statStorageKey(), JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Could not save stat settings:', error);
        return false;
    }
}

function applyStatSettings(el, settings) {
    if (!el || !settings) return;
    el.style.setProperty('--stat-size', `${settings.size}rem`);
    el.style.setProperty('--stat-gap', `${settings.gap}rem`);
    el.style.setProperty('--stat-box-width', `${settings.boxWidth}%`);
}

function readCssRem(el, variable, fallback) {
    const inline = el.style.getPropertyValue(variable).trim();
    const computed = getComputedStyle(el).getPropertyValue(variable).trim();
    const raw = inline || computed || `${fallback}rem`;
    const match = raw.match(/([\d.]+)rem/);
    if (match) return parseFloat(match[1]);
    const px = parseFloat(raw);
    if (!Number.isNaN(px) && px > 3) return px / 16;
    return fallback;
}

function readCssPercent(el, variable, fallback) {
    const inline = el.style.getPropertyValue(variable).trim();
    const computed = getComputedStyle(el).getPropertyValue(variable).trim();
    const raw = inline || computed || `${fallback}%`;
    const match = raw.match(/([\d.]+)%/);
    if (match) return parseFloat(match[1]);
    return fallback;
}

function captureStatSettings(el) {
    return {
        size: Math.round(readCssRem(el, '--stat-size', STAT_DEFAULTS.size) * 100) / 100,
        gap: Math.round(readCssRem(el, '--stat-gap', STAT_DEFAULTS.gap) * 100) / 100,
        boxWidth: Math.round(readCssPercent(el, '--stat-box-width', STAT_DEFAULTS.boxWidth) * 10) / 10,
    };
}

function exportStatCss(settings) {
    const project = currentStatProject() || 'serve';
    return [
        '/* Locked stat circles — paste into scrapbook-patterns.css */',
        '',
        `.scrapbook--${project} .scrap-stickers--compact {`,
        `    --stat-size: ${settings.size}rem;`,
        `    --stat-gap: ${settings.gap}rem;`,
        `    --stat-box-width: ${settings.boxWidth}%;`,
        '    column-gap: var(--stat-gap);',
        '    width: var(--stat-box-width);',
        '}',
        '',
    ].join('\n');
}

function showStatToast(message) {
    let toast = document.querySelector('.stat-editor-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'stat-editor-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showStatToast._timer);
    showStatToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function formatSettingLabel(key, value) {
    return key === 'boxWidth' ? `${value}%` : `${value}rem`;
}

function initStatSettings() {
    if (!editStats) return;

    const row = getStatStickerRow();
    if (!row) return;
    applyStatSettings(row, loadStatSettings());
}

function initStatEditor() {
    if (!editStats) return;

    const row = getStatStickerRow();
    if (!row) return;

    document.body.classList.add('stat-editor-active');

    let settings = loadStatSettings();
    applyStatSettings(row, settings);

    const panel = document.createElement('div');
    panel.className = 'stat-editor-panel';
    panel.innerHTML = `
        <strong>Stat editor</strong>
        <span class="stat-editor-hint">Adjust circle size, spacing, and the box width they span · Copy CSS when done</span>
        <div class="stat-editor-control">
            <label>Circle size <span data-value="size">${formatSettingLabel('size', settings.size)}</span></label>
            <input type="range" data-setting="size" min="3" max="10" step="0.25" value="${settings.size}">
        </div>
        <div class="stat-editor-control">
            <label>Spacing <span data-value="gap">${formatSettingLabel('gap', settings.gap)}</span></label>
            <input type="range" data-setting="gap" min="0" max="6" step="0.1" value="${settings.gap}">
        </div>
        <div class="stat-editor-control">
            <label>Box width <span data-value="boxWidth">${formatSettingLabel('boxWidth', settings.boxWidth)}</span></label>
            <input type="range" data-setting="boxWidth" min="35" max="100" step="1" value="${settings.boxWidth}">
        </div>
        <button type="button" class="stat-editor-primary" data-action="lock">Lock</button>
        <button type="button" data-action="copy">Copy CSS</button>
        <button type="button" data-action="reset">Reset</button>
        <button type="button" data-action="exit">Exit</button>
    `;
    document.body.appendChild(panel);

    function updateSetting(key, value) {
        settings[key] = key === 'boxWidth'
            ? Math.round(parseFloat(value))
            : Math.round(parseFloat(value) * 100) / 100;
        applyStatSettings(row, settings);
        const label = panel.querySelector(`[data-value="${key}"]`);
        if (label) label.textContent = formatSettingLabel(key, settings[key]);
    }

    panel.querySelectorAll('input[data-setting]').forEach((input) => {
        input.addEventListener('input', () => {
            updateSetting(input.dataset.setting, input.value);
        });
    });

    panel.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        if (action === 'lock') {
            const current = captureStatSettings(row);
            const saved = saveStatSettings(current);
            showStatToast(saved
                ? `Saved — ${current.size}rem circles, ${current.gap}rem gap, ${current.boxWidth}% box`
                : 'Save failed — use Copy CSS instead.');
        }

        if (action === 'copy') {
            const css = exportStatCss(captureStatSettings(row));
            navigator.clipboard.writeText(css).then(() => {
                showStatToast('CSS copied — send it to lock in permanently.');
            }).catch(() => {
                console.log(css);
                showStatToast('CSS logged to console (clipboard blocked).');
            });
        }

        if (action === 'reset') {
            localStorage.removeItem(statStorageKey());
            row.removeAttribute('style');
            settings = { ...STAT_DEFAULTS };
            panel.querySelectorAll('input[data-setting]').forEach((input) => {
                input.value = settings[input.dataset.setting];
                updateSetting(input.dataset.setting, input.value);
            });
            showStatToast('Reset to defaults.');
        }

        if (action === 'exit') {
            saveStatSettings(captureStatSettings(row));
            const url = new URL(location.href);
            url.searchParams.delete('edit-stats');
            location.href = url.toString();
        }
    });
}

initStatSettings();
initStatEditor();
