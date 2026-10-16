import { button, checkbox, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, number, panel } from '../lib/ui';

function cryptoRandom() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 0x100000000;
}

export default function mount({ root, complete, announce }) {
    const names = textarea({
        label: 'Entries (one per line)',
        rows: 8,
        placeholder: 'Alice\nBob\nCarol\nDave',
        hint: 'Add the same name twice to weight it twice.',
    });
    const winnersCount = number({ label: 'Number of winners', value: 1, min: 1, max: 50, step: 1 });
    const allowDuplicates = checkbox({ label: 'Allow the same entry to win more than once' });
    const shuffleMode = checkbox({ label: 'Shuffle the whole list instead of picking winners' });
    const draw = button({ label: 'Pick random winner(s)', variant: 'primary' });
    const copy = button({ label: 'Copy result' });
    const feedback = status();
    const output = document.createElement('pre');
    output.className = 'field-input whitespace-pre-wrap font-mono text-sm';
    output.hidden = true;
    let lastText = '';
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(draw, copy);

    root.append(
        panel({ title: 'Entries', body: names.el }),
        panel({ title: 'Result', body: node('<div></div>') }),
    );
    root.firstElementChild.querySelector('[data-panel-body]').append(winnersCount.el, allowDuplicates.el, shuffleMode.el, actions, feedback.el);
    root.lastElementChild.querySelector('[data-panel-body]').append(output);

    draw.addEventListener('click', () => {
        const entries = names.textarea.value.split(/\r?\n/).map((n) => n.trim()).filter(Boolean);
        if (entries.length === 0) {
            feedback.set('Add at least one entry.', 'warning');
            return;
        }
        if (shuffleMode.input.checked) {
            lastText = entries
                .map((name) => ({ name, sort: cryptoRandom() }))
                .sort((a, b) => a.sort - b.sort)
                .map((item, i) => `${i + 1}. ${item.name}`)
                .join('\n');
        } else {
            const count = Math.max(1, Math.round(Number(winnersCount.input.value) || 1));
            const pool = [...entries];
            const winners = [];
            for (let i = 0; i < count; i += 1) {
                if (pool.length === 0) {
                    if (!allowDuplicates.input.checked) break;
                    pool.push(...entries);
                }
                const index = Math.floor(cryptoRandom() * pool.length);
                winners.push(pool[index]);
                if (!allowDuplicates.input.checked) {
                    pool.splice(index, 1);
                }
            }
            lastText = winners.map((winner, i) => `Winner ${i + 1}: ${winner}`).join('\n');
        }
        output.textContent = lastText;
        output.hidden = false;
        feedback.set('Draw complete - crypto-grade randomness.', 'success');
        announce('Random draw complete.');
        void complete();
    });

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(lastText);
        feedback.set(ok ? 'Copied to clipboard.' : 'Copying blocked - select the text and press Ctrl+C.', ok ? 'success' : 'warning');
    });
}
