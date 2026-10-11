import { createCalculatorView } from './view';

export function mountCalculator({ root, announce, complete }, view, calculate) {
    const ui = createCalculatorView(root, view);

    ui.calculateButton.addEventListener('click', () => {
        try {
            const values = ui.controls.map((control) => control.input?.value ?? control.select?.value);
            ui.result.textContent = view.format(calculate(values));
            ui.feedback.set('');
            announce(`${view.title} calculated.`);
            void complete();
        } catch (error) {
            ui.result.textContent = '';
            ui.feedback.set(error instanceof Error ? error.message : 'The calculation could not be completed.', 'error');
            announce(error instanceof Error ? error.message : 'The calculation could not be completed.');
        }
    });
}
