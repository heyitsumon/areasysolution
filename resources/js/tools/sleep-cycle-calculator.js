import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

/**
 * Sleep cycle calculator: pick "sleep now" or a wake-up time and get bed/wake
 * times aligned to ~90-minute sleep cycles plus 15 minutes to fall asleep.
 * The cycle math is pure and unit-testable.
 */

const CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 15;

export function sleepTimes({ fromMinutes, cycles, isWakeTarget }) {
    const options = [];
    for (let n = 1; n <= cycles; n += 1) {
        const duration = n * CYCLE_MINUTES;
        const minutes = isWakeTarget
            ? fromMinutes - FALL_ASLEEP_MINUTES - duration
            : fromMinutes + FALL_ASLEEP_MINUTES + duration;
        const wrapped = ((minutes % 1440) + 1440) % 1440;
        options.push({ cycles: n, hours: Math.floor(duration / 60), minutes: duration % 60, clock: clockLabel(wrapped) });
    }
    return options.reverse();
}

export function clockLabel(totalMinutes) {
    const h24 = Math.floor((((totalMinutes % 1440) + 1440) % 1440) / 60);
    const m = Math.round(((totalMinutes % 1440) + 1440) % 1440 % 60);
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function mount({ root, announce, complete }) {
    const mode = select({
        label: 'I want to…',
        options: [
            { value: 'wake', label: 'Wake up at a specific time → find my bedtime' },
            { value: 'bed', label: 'Go to bed now → find my wake-up times' },
        ],
        value: 'wake',
    });
    const hour = number({ label: 'Target hour (24h)', value: 7, min: 0, max: 23, step: 1 });
    const minute = number({ label: 'Target minute', value: 30, min: 0, max: 59, step: 1 });

    const calcBtn = button({ label: 'Calculate Sleep Times', variant: 'primary' });
    const feedback = status();
    const resultsBox = node('<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-3"></div>');
    inputsGrid.append(mode.el, hour.el, minute.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsBox);
    root.append(panel({ title: 'Sleep Cycle Calculator', description: 'Wake up between sleep cycles, not in the middle of one — see the best bedtimes or wake-up times.', body }));

    function run() {
        const fromMinutes = Number(hour.input.value) * 60 + Number(minute.input.value);
        const isWakeTarget = mode.select.value === 'wake';
        const options = sleepTimes({ fromMinutes, cycles: 6, isWakeTarget });

        resultsBox.innerHTML = options.map((o) => `
            <div class="rounded-xl border ${o.cycles >= 5 ? 'border-emerald-200 bg-emerald-50/70' : o.cycles >= 3 ? 'border-indigo-200 bg-indigo-50/70' : 'border-amber-200 bg-amber-50/70'} p-4">
                <p class="text-xs font-semibold uppercase ${o.cycles >= 5 ? 'text-emerald-700' : o.cycles >= 3 ? 'text-indigo-700' : 'text-amber-700'}">${o.cycles} cycle${o.cycles > 1 ? 's' : ''} · ${o.hours}h ${o.minutes}m</p>
                <p class="text-2xl font-extrabold text-slate-900 mt-1">${o.clock}</p>
                <p class="text-xs text-slate-500 mt-1">${o.cycles >= 5 ? 'Recommended' : o.cycles >= 3 ? 'Decent' : 'Short night'}</p>
            </div>
        `).join('');

        feedback.set('');
        announce(`Best times: ${options.map((o) => o.clock).join(', ')}.`);
        void complete();
    }

    [hour.input, minute.input].forEach((el) => el.addEventListener('input', run));
    mode.select.addEventListener('change', run);
    calcBtn.addEventListener('click', run);
    run();
}
