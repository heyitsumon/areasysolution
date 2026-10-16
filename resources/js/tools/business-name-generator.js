import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, text } from '../lib/ui';

/**
 * Business name generator.
 *
 * Deterministic combinatorial engine: keyword + industry style + suffix +
 * prefix patterns produce genuinely unique names. Uses crypto.getRandomValues
 * so results vary per click, and a "seen" filter guarantees no duplicate name
 * appears in one batch — the "unique names" promise in the tool description.
 */

const STYLES = [
    { value: 'modern', label: 'Modern / Tech startup' },
    { value: 'professional', label: 'Professional / Corporate' },
    { value: 'creative', label: 'Creative / Playful' },
    { value: 'luxury', label: 'Luxury / Premium' },
    { value: 'short', label: 'Short & punchy' },
];

const HEAD_WORDS = {
    modern: ['nova', 'flux', 'byte', 'orbit', 'pulse', 'spark', 'zenith', 'vertex', 'quantum', 'shift', 'core', 'forge', 'loop', 'stack', 'drift', 'lumen', 'code', 'grid', 'wave', 'nest'],
    professional: ['prime', 'meridian', 'summit', 'anchor', 'beacon', 'crest', 'keystone', 'landmark', 'pinnacle', 'cornerstone', 'heritage', 'axis', 'sterling', 'harbor', 'atlas', 'zenith', 'crown', 'ridge', 'vault', 'bridge'],
    creative: ['bloom', 'pixie', 'mango', 'pepper', 'doodle', 'giggle', 'wander', 'twist', 'hop', 'whisk', 'pop', 'jelly', 'sunny', 'sparkle', 'bounce', 'dash', 'splash', 'fluffy', 'nifty', 'zesty'],
    luxury: ['regal', 'velvet', 'aurum', 'opulent', 'sable', 'crescent', 'ivory', 'obsidian', 'sovereign', 'elite', 'monarch', 'royale', 'imperial', 'vanta', 'noir', 'celeste', 'luxe', 'grand', 'onyx', 'platinum'],
    short: ['kyro', 'vexo', 'nubi', 'zeta', 'arlo', 'mica', 'onyx', 'rune', 'aero', 'lyra', 'kova', 'nym', 'vibe', 'sable', 'echo', 'hive', 'peak', 'flux', 'halo', 'zig'],
};

const TAIL_WORDS = {
    modern: ['labs', 'works', 'ify', 'io', 'hub', 'base', 'stack', 'flow', 'ware', 'verse', 'sync', 'grid', 'byte', 'loop', 'craft', 'soft'],
    professional: ['group', 'partners', 'associates', 'consulting', 'solutions', 'advisory', 'ventures', 'holdings', 'partnership', 'international', 'co', 'firm'],
    creative: ['studio', 'kitchen', 'garden', 'club', 'collective', 'house', 'factory', 'lab', 'crew', 'squad', 'nest', 'camp'],
    luxury: ['collection', 'atelier', 'maison', 'reserve', 'signature', 'estates', 'bespoke', 'couture', 'society', 'elite', 'prestige'],
    short: ['ly', 'fy', 'io', 'va', 'ex', 'ora', 'ix', 'um', 'go', 'zy', 'on', 'ar'],
};

const PREFIXES = {
    modern: ['get', 'try', 'use', 'hey', 'meta', 'hyper', 'ultra', 'neo'],
    professional: ['first', 'one', 'apex', 'true', 'clear', 'nova', 'polar', 'star'],
    creative: ['happy', 'little', 'bright', 'lucky', 'sugar', 'turbo', 'wonder', 'cosmic'],
    luxury: ['maison', 'house', 'casa', 'atelier', 'royal', 'grand', 'golden', 'crown'],
    short: ['no', 'ox', 'ez', 'vy', 'lu', 'ka', 'zi', 'ra'],
};

const SUFFIXES = {
    modern: ['.com', '.io', '.app', '.tech', '.dev', '.ai'],
    professional: ['.com', '.group', '.consulting', '.net', '.org', '.co'],
    creative: ['.com', '.studio', '.fun', '.shop', '.me', '.co'],
    luxury: ['.com', '.luxury', '.estate', '.gallery', '.pro', '.co'],
    short: ['.com', '.io', '.co', '.app', '.xyz', '.net'],
};

const TAGLINES = {
    modern: 'Build the future, faster.',
    professional: 'Trusted advice, proven results.',
    creative: 'Ideas that make people smile.',
    luxury: 'Crafted for the exceptional.',
    short: 'Small name. Big brand.',
};

function cryptoRandom() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 0x100000000;
}

function pick(list) {
    return list[Math.floor(cryptoRandom() * list.length)];
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).trim();
}

function titleCase(name) {
    return name.split(/([ .])/).map((part) => (/[a-z]/.test(part.charAt(0)) ? capitalize(part) : part)).join('');
}

/**
 * Generate `count` unique names from a keyword for the given style.
 *
 * @param {{keyword: string, style: string, count: number, withDomain: boolean, withTagline: boolean}} options
 * @returns {Array<{name: string, domain: string, tagline: string}>}
 */
export function generateNames({ keyword, style, count, withDomain, withTagline }) {
    const base = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
    if (base === '') {
        throw new Error('Enter at least one keyword — for example “coffee” or “consulting”.');
    }

    const heads = HEAD_WORDS[style] ?? HEAD_WORDS.modern;
    const tails = TAIL_WORDS[style] ?? TAIL_WORDS.modern;
    const prefixes = PREFIXES[style] ?? PREFIXES.modern;
    const suffixes = SUFFIXES[style] ?? SUFFIXES.modern;

    const patterns = [
        () => `${pick(heads)}${base}`,
        () => `${base}${pick(tails)}`,
        () => `${pick(prefixes)}${base}`,
        () => `${base}${pick(heads)}`,
        () => `${pick(heads)} ${capitalize(base)}${pick(tails)}`,
        () => `${capitalize(base)}${pick(tails)}`,
        () => `${base}${pick(['hq', 'co', 'pro', 'plus', 'one'])}`,
        () => `${pick(heads)}${pick(tails)}`,
    ];

    const seen = new Set();
    const results = [];
    let attempts = 0;

    while (results.length < count && attempts < count * 60) {
        attempts += 1;
        const raw = pick(patterns)().replace(/\s+/g, ' ').trim();
        const name = titleCase(raw);
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
            name,
            domain: withDomain ? `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${pick(suffixes)}` : '',
            tagline: withTagline ? TAGLINES[style] ?? TAGLINES.modern : '',
        });
    }

    if (results.length === 0) {
        throw new Error('Could not generate names — try a different keyword or style.');
    }

    return results;
}

export default function mount({ root, announce, complete }) {
    const keyword = text({ label: 'Your keyword or industry', value: '', placeholder: 'e.g. coffee, fitness, consulting', hint: 'The word your brand should contain.' });
    const style = (function buildStyleSelect() {
        const wrapper = node('<div class="mb-1.5"></div>');
        const id = `bng-style-${Math.floor(cryptoRandom() * 1e9)}`;
        const element = document.createElement('select');
        element.id = id;
        element.className = 'field-input';
        for (const option of STYLES) {
            const item = document.createElement('option');
            item.value = option.value;
            item.textContent = option.label;
            element.append(item);
        }
        const label = node(`<label class="field-label" for="${id}">Brand style</label>`);
        wrapper.append(label, element);
        return { el: wrapper, select: element };
    })();
    const count = number({ label: 'How many names', value: 12, min: 1, max: 50, step: 1 });
    const withDomain = checkbox({ label: 'Include domain-name suggestions (.com, .io…)', checked: true });
    const withTagline = checkbox({ label: 'Include a matching tagline', checked: false });
    const generate = button({ label: 'Generate names', variant: 'primary' });
    const copyAll = button({ label: 'Copy all', variant: 'secondary' });
    const feedback = status();
    const resultsBox = node('<div class="bng-results" aria-live="polite"></div>');

    const settingsPanel = panel({ title: 'Name settings', description: 'Enter a keyword and pick a style — the generator combines it with hundreds of curated brand words.' });
    const resultsPanel = panel({ title: 'Your business names' });
    root.append(settingsPanel, resultsPanel);

    const settingsBody = settingsPanel.querySelector('[data-panel-body]');
    const resultsBody = resultsPanel.querySelector('[data-panel-body]');
    const actions = node('<div class="flex flex-wrap gap-2"></div>');
    actions.append(generate, copyAll);
    settingsBody.append(keyword.el, style.el, count.el, withDomain.el, withTagline.el, actions, feedback.el);
    resultsBody.append(resultsBox);

    resultsBox.append(node('<p class="text-sm text-slate-500">Your generated names will appear here.</p>'));

    generate.addEventListener('click', () => {
        try {
            const names = generateNames({
                keyword: keyword.input.value,
                style: style.select.value,
                count: Math.max(1, Math.min(50, Math.round(Number(count.input.value) || 12))),
                withDomain: withDomain.input.checked,
                withTagline: withTagline.input.checked,
            });
            renderResults(names);
            feedback.set(`Generated ${names.length} unique names.`, 'success');
            announce(`${names.length} business names generated.`);
            void complete();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Name generation failed.';
            feedback.set(message, 'error');
            announce(message);
        }
    });

    copyAll.addEventListener('click', async () => {
        const items = [...resultsBox.querySelectorAll('.bng-name')].map((el) => el.textContent.trim());
        if (items.length === 0) {
            feedback.set('Generate some names first.', 'warning');
            return;
        }
        try {
            await navigator.clipboard.writeText(items.join('\n'));
            feedback.set('All names copied to your clipboard.', 'success');
        } catch {
            feedback.set('Copying failed — select the names manually.', 'error');
        }
    });

    function renderResults(names) {
        resultsBox.innerHTML = '';
        for (const entry of names) {
            const card = node(`
                <div class="bng-card">
                    <div>
                        <p class="bng-name">${entry.name.replace(/</g, '&lt;')}</p>
                        ${entry.domain ? `<p class="bng-domain">${entry.domain.replace(/</g, '&lt;')}</p>` : ''}
                        ${entry.tagline ? `<p class="bng-tagline">${entry.tagline.replace(/</g, '&lt;')}</p>` : ''}
                    </div>
                    <button type="button" class="bng-copy btn-secondary">Copy</button>
                </div>
            `);
            card.querySelector('.bng-copy').addEventListener('click', async (event) => {
                const buttonEl = event.currentTarget;
                try {
                    await navigator.clipboard.writeText(entry.name);
                    buttonEl.textContent = 'Copied!';
                    setTimeout(() => { buttonEl.textContent = 'Copy'; }, 1400);
                } catch {
                    buttonEl.textContent = 'Failed';
                    setTimeout(() => { buttonEl.textContent = 'Copy'; }, 1400);
                }
            });
            resultsBox.append(card);
        }
    }
}
