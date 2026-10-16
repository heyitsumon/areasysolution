import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel } from '../lib/ui';

function cryptoRandom() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 0x100000000;
}

export default function mount({ root, complete, announce }) {
    const count = number({ label: 'How many dice', value: 2, min: 1, max: 20, step: 1 });
    const sides = number({ label: 'Sides per die', value: 6, min: 2, max: 1000, step: 1 });
    const modifier = number({ label: 'Modifier (add to total)', value: 0, min: -100, max: 100, step: 1 });
    const showIndividual = checkbox({ label: 'Show each die result', value: true });
    const roll = button({ label: 'Roll dice', variant: 'primary' });
    const feedback = status();
    const display = node('<div class="text-center font-mono text-5xl font-bold text-slate-900" aria-live="polite">-</div>');
    const detail = node('<div class="mt-2 text-center text-sm text-slate-600"></div>');
    const history = node('<div class="mt-4 max-h-40 overflow-y-auto font-mono text-sm text-slate-600"></div>');
    const actions = node('<div class="mt-4 flex justify-center"></div>');
    actions.append(roll);

    root.append(
        panel({ title: 'Dice settings', body: node('<div></div>') }),
        panel({ title: 'Result', body: node('<div></div>') }),
    );
    root.children[0].querySelector('[data-panel-body]').append(count.el, sides.el, modifier.el, showIndividual.el);
    root.children[1].querySelector('[data-panel-body]').append(display, detail, actions, feedback.el, history);

    roll.addEventListener('click', () => {
        const diceCount = Math.round(Number(count.input.value) || 1);
        const sidesCount = Math.round(Number(sides.input.value) || 6);
        const mod = Math.round(Number(modifier.input.value) || 0);
        if (diceCount < 1 || diceCount > 20 || sidesCount < 2 || sidesCount > 1000) {
            feedback.set('Use 1-20 dice with 2-1000 sides.', 'warning');
            return;
        }
        const rolls = Array.from({ length: diceCount }, () => 1 + Math.floor(cryptoRandom() * sidesCount));
        const total = rolls.reduce((sum, value) => sum + value, 0) + mod;
        display.textContent = String(total);
        detail.textContent = showIndividual.input.checked
            ? `Dice: ${rolls.join(' + ')}${mod !== 0 ? ` ${mod > 0 ? '+' : '-'} ${Math.abs(mod)}` : ''}`
            : `${diceCount}d${sidesCount}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''}`;
        const entry = node(`<div class="flex justify-between border-b border-slate-100 py-1"><span>${diceCount}d${sidesCount}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''}</span><span>${total}</span></div>`);
        history.prepend(entry);
        if (history.children.length > 20) {
            history.lastElementChild.remove();
        }
        feedback.set(`Rolled ${diceCount}d${sidesCount}.`, 'success');
        announce(`Rolled ${total}.`);
        void complete();
    });
}
