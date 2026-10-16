import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, number, panel } from '../lib/ui';

function cryptoRandomInt(maxInclusive) {
    const range = 0x100000000;
    const cutoff = range - (range % maxInclusive);
    const values = new Uint32Array(1);
    do {
        crypto.getRandomValues(values);
    } while (values[0] >= cutoff);
    return values[0] % maxInclusive;
}

export default function mount({ root, complete, announce }) {
    const min = number({ label: 'Minimum', value: 1, min: -1e12, max: 1e12, step: 'any' });
    const max = number({ label: 'Maximum', value: 100, min: -1e12, max: 1e12, step: 'any' });
    const howMany = number({ label: 'How many numbers', value: 1, min: 1, max: 1000, step: 1 });
    const unique = checkbox({ label: 'No repeats (unique numbers)' });
    const sorted = checkbox({ label: 'Sort results' });
    const generate = button({ label: 'Generate numbers', variant: 'primary' });
    const copy = button({ label: 'Copy result' });
    const feedback = status();
    const display = node('<div class="text-center font-mono text-4xl font-bold text-slate-900" aria-live="polite">-</div>');
    const all = node('<div class="mt-3 max-h-48 overflow-y-auto font-mono text-sm text-slate-600"></div>');
    let lastText = '';
    const actions = node('<div class="mt-4 flex flex-wrap justify-center gap-2"></div>');
    actions.append(generate, copy);

    root.append(
        panel({ title: 'Range & options', body: node('<div></div>') }),
        panel({ title: 'Result', body: node('<div></div>') }),
    );
    root.children[0].querySelector('[data-panel-body]').append(min.el, max.el, howMany.el, unique.el, sorted.el);
    root.children[1].querySelector('[data-panel-body]').append(display, all, actions, feedback.el);

    generate.addEventListener('click', () => {
        const low = Math.floor(Number(min.input.value));
        const high = Math.floor(Number(max.input.value));
        const n = Math.round(Number(howMany.input.value) || 1);
        if (!Number.isFinite(low) || !Number.isFinite(high) || high < low) {
            feedback.set('The maximum must be greater than or equal to the minimum.', 'warning');
            return;
        }
        const span = high - low + 1;
        if (unique.input.checked && n > span) {
            feedback.set(`Cannot pick ${n} unique numbers from a range of ${span}.`, 'warning');
            return;
        }
        const results = [];
        if (unique.input.checked && span <= 100000) {
            const pool = Array.from({ length: span }, (_, i) => low + i);
            for (let i = 0; i < n; i += 1) {
                const index = cryptoRandomInt(pool.length - i) + i;
                [pool[i], pool[index]] = [pool[index], pool[i]];
                results.push(pool[i]);
            }
        } else {
            for (let i = 0; i < n; i += 1) {
                results.push(low + cryptoRandomInt(span));
            }
        }
        if (sorted.input.checked) {
            results.sort((a, b) => a - b);
        }
        lastText = results.join(', ');
        display.textContent = n === 1 ? String(results[0]) : `${results.length} numbers`;
        all.textContent = n > 1 ? lastText : '';
        feedback.set(`Generated ${results.length} random number${results.length === 1 ? '' : 's'} with crypto-grade randomness.`, 'success');
        announce(`Generated ${results.length} numbers.`);
        void complete();
    });

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(lastText);
        feedback.set(ok ? 'Copied to clipboard.' : 'Copying blocked - select the text and press Ctrl+C.', ok ? 'success' : 'warning');
    });
}
