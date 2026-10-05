import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select, text } from '../lib/ui';

export function mountCalculator({ root, announce, complete }, { title, fields, calculate }) {
    const controls = fields.map((field) => {
        if (field.type === 'select') return select(field);
        if (field.type === 'date') return text({ ...field, type: 'date' });
        return number(field);
    });
    const calculateButton = button({ label: 'Calculate', variant: 'primary' });
    const result = node('<div class="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-slate-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-slate-100" role="status" aria-live="polite">Enter your values and select Calculate.</div>');
    const feedback = status();
    const body = node('<div class="space-y-4"></div>');
    const actions = node('<div class="flex flex-wrap gap-2"></div>');

    actions.append(calculateButton);
    body.append(...controls.map((control) => control.el), actions, result, feedback.el);
    calculateButton.addEventListener('click', () => {
        try {
            result.textContent = calculate(controls.map((control) => control.input?.value ?? control.select?.value));
            feedback.set('');
            announce(`${title} calculated.`);
            void complete();
        } catch (error) {
            result.textContent = '';
            feedback.set(error.message, 'error');
            announce(error.message);
        }
    });

    root.append(panel({ title, body }));
}
