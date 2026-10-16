import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

/**
 * Running pace calculator: time + distance → pace per km/mile, speed, and
 * race-projection splits for common distances. Pure functions are exported
 * for unit tests.
 */

export function paceFromRun(distanceKm, totalMinutes) {
    if (distanceKm <= 0) throw new Error('Distance must be greater than zero.');
    if (totalMinutes <= 0) throw new Error('Time must be greater than zero.');
    const minutesPerKm = totalMinutes / distanceKm;
    return {
        minutesPerKm,
        minutesPerMile: minutesPerKm * 1.609344,
        speedKmh: 60 / minutesPerKm,
        speedMph: 60 / (minutesPerKm * 1.609344),
    };
}

export function projectRace(minutesPerKm, distanceKm) {
    return minutesPerKm * distanceKm;
}

const RACES = [
    { label: '5K', km: 5 },
    { label: '10K', km: 10 },
    { label: 'Half marathon', km: 21.0975 },
    { label: 'Marathon', km: 42.195 },
];

export function clockLabel(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor((totalMinutes % 60));
    const s = Math.round((totalMinutes % 1) * 60);
    return (h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + `:${String(s).padStart(2, '0')}`;
}

export default function mount({ root, announce, complete }) {
    const distance = number({ label: 'Distance (km)', value: 10, min: 0.1, step: 0.1 });
    const hours = number({ label: 'Hours', value: 0, min: 0, max: 24, step: 1 });
    const minutes = number({ label: 'Minutes', value: 50, min: 0, max: 59, step: 1 });
    const seconds = number({ label: 'Seconds', value: 0, min: 0, max: 59, step: 1 });

    const calcBtn = button({ label: 'Calculate Pace', variant: 'primary' });
    const feedback = status();
    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4"></div>');
    const splitsBox = node('<div class="mt-5"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-4"></div>');
    inputsGrid.append(distance.el, hours.el, minutes.el, seconds.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid, splitsBox);
    root.append(panel({ title: 'Running Pace Calculator', description: 'Enter a recent run to get pace per km/mile, speed, and predicted finish times for the classic race distances.', body }));

    function run() {
        try {
            const totalMinutes = Number(hours.input.value) * 60 + Number(minutes.input.value) + Number(seconds.input.value) / 60;
            const res = paceFromRun(Number(distance.input.value), totalMinutes);
            const fmtPace = (m) => `${Math.floor(m)}:${String(Math.round(m % 1 * 60)).padStart(2, '0')} /km`;

            resultsGrid.innerHTML = `
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Pace per KM</p>
                    <p class="text-2xl font-extrabold text-emerald-950 mt-1">${fmtPace(res.minutesPerKm)}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Pace per Mile</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">${fmtPace(res.minutesPerMile)}</p>
                </div>
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Speed</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">${res.speedKmh.toFixed(1)} km/h</p>
                </div>
                <div class="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-amber-700 uppercase">Speed (mph)</p>
                    <p class="text-2xl font-extrabold text-amber-950 mt-1">${res.speedMph.toFixed(1)} mph</p>
                </div>
            `;

            splitsBox.innerHTML = `
                <h3 class="text-sm font-bold text-slate-700 mb-2">Race predictions (same effort)</h3>
                <div class="grid gap-3 sm:grid-cols-4">
                    ${RACES.map((r) => `
                        <div class="rounded-xl border border-slate-200 bg-white p-3 text-center">
                            <p class="text-xs font-semibold text-slate-500 uppercase">${r.label}</p>
                            <p class="text-lg font-extrabold text-slate-900 mt-1">${clockLabel(projectRace(res.minutesPerKm, r.km))}</p>
                        </div>
                    `).join('')}
                </div>
            `;

            feedback.set('');
            announce(`Pace is ${fmtPace(res.minutesPerKm)}.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [distance.input, hours.input, minutes.input, seconds.input].forEach((el) => el.addEventListener('input', run));
    calcBtn.addEventListener('click', run);
    run();
}
