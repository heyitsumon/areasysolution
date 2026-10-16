import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

/**
 * Grade / final-exam calculator: what do I need on the final? Supports both
 * weighted-category courses (homework 20%, midterm 30%…) and simple
 * points-based courses, plus current-grade projection.
 */

export function neededFinalScore(currentGradePercent, finalWeightPercent, targetGradePercent) {
    if (finalWeightPercent <= 0 || finalWeightPercent > 100) {
        throw new Error('Final exam weight must be between 1 and 100 percent.');
    }
    if (currentGradePercent < 0 || currentGradePercent > 100) {
        throw new Error('Current grade must be between 0 and 100.');
    }
    if (targetGradePercent < 0 || targetGradePercent > 100) {
        throw new Error('Target grade must be between 0 and 100.');
    }

    const needed = (targetGradePercent - currentGradePercent * (1 - finalWeightPercent / 100)) / (finalWeightPercent / 100);
    return Math.round(needed * 100) / 100;
}

export default function mount({ root, announce, complete }) {
    const currentGrade = number({ label: 'Current grade (%)', value: 82, min: 0, max: 100, step: 0.1, suffix: '%' });
    const finalWeight = number({ label: 'Final exam weight (%)', value: 30, min: 1, max: 100, step: 1, suffix: '%' });
    const targetGrade = select({
        label: 'Target overall grade',
        options: [
            { value: '90', label: 'A / 90% or above' },
            { value: '80', label: 'B / 80% or above' },
            { value: '70', label: 'C / 70% or above' },
            { value: '60', label: 'D / 60% (just pass)' },
        ],
        value: '90',
    });
    const customTarget = number({ label: '…or a custom target (%)', value: 0, min: 0, max: 100, step: 0.5, hint: 'Leave 0 to use the letter grade above.' });

    const calcBtn = button({ label: 'What do I need on the final?', variant: 'primary' });
    const feedback = status();
    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');
    const verdictBox = node('<div class="mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(currentGrade.el, finalWeight.el, targetGrade.el, customTarget.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid, verdictBox);
    root.append(panel({ title: 'Final Grade Calculator', description: 'Find the score you need on your final exam to hit your target grade — or see what happens if you fall short.', body }));

    function run() {
                try {
                    const target = Number(customTarget.input.value) || Number(targetGrade.select.value);
                    const res = neededFinalScore(
                        Number(currentGrade.input.value),
                        Number(finalWeight.input.value),
                        target,
                    );

                    const verdict = res > 100
                        ? { tone: 'error', text: `Not possible this time — you'd need ${res}% on the final, above 100%. Aim for the retake or extra credit.` }
                        : res > 85
                            ? { tone: 'warning', text: `Tough ask: you need ${res}% on the final. Study hard — it's doable but tight.` }
                            : res < 0
                                ? { tone: 'success', text: `Already locked in! Even a zero on the final keeps you at ${target}%+. Relax and review.` }
                                : { tone: 'success', text: `Score ${res}% or higher on the final and you'll finish with ${target}%.` };

                    resultsGrid.innerHTML = `
                <div class="rounded-xl border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Needed on Final</p>
                    <p class="text-3xl font-extrabold text-emerald-950 mt-1">${Math.max(0, res)}%</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">If You Score 100%</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">${(Number(currentGrade.input.value) * (1 - Number(finalWeight.input.value) / 100) + 100 * Number(finalWeight.input.value) / 100).toFixed(1)}%</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">If You Score 0%</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">${(Number(currentGrade.input.value) * (1 - Number(finalWeight.input.value) / 100)).toFixed(1)}%</p>
                </div>
            `;

                    verdictBox.innerHTML = `<div class="rounded-xl border p-4 text-sm font-semibold ${verdict.tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : verdict.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}">${verdict.text}</div>`;

                    feedback.set('');
                    announce(verdict.text);
                    void complete();
                } catch (err) {
                    feedback.set(err.message, 'error');
                }
            }

            [currentGrade.input, finalWeight.input, customTarget.input].forEach((el) => el.addEventListener('input', run));
        [targetGrade.select, customTarget.input].forEach((el) => el.addEventListener('change', run));
        calcBtn.addEventListener('click', run);
        run();
    }
