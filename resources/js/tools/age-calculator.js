import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, text } from '../lib/ui';
import { ageDetailsOn } from './calculators-core';

const numberFormat = new Intl.NumberFormat();

function localDateString(date = new Date()) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

function toDisplayDate(isoDate) {
    const [year, month, day] = isoDate.split('-');

    return `${day}-${month}-${year}`;
}

function toIsoDate(displayDate) {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/u.exec(displayDate.trim());
    if (!match) throw new Error('Enter dates in DD-MM-YYYY format, for example 07-10-1999.');

    const [, day, month, year] = match;

    return `${year}-${month}-${day}`;
}

export default function mount({ root, announce, complete }) {
    root.classList.add('age-calculator');

    const birthDate = text({
        label: 'Date of birth',
        type: 'text',
        placeholder: 'DD-MM-YYYY',
        hint: 'Enter day-month-year, for example 07-10-1999.',
    });
    const asOfDate = text({
        label: 'Age at the date of',
        type: 'text',
        value: toDisplayDate(localDateString()),
        placeholder: 'DD-MM-YYYY',
        hint: 'Enter day-month-year for the date to calculate your age on.',
    });

    [birthDate.input, asOfDate.input].forEach((input) => {
        input.maxLength = 10;
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.classList.add('age-cal__date-input');
    });

    const dateFields = node('<div class="age-cal__date-fields"></div>');
    dateFields.append(birthDate.el, asOfDate.el);
    const calculateButton = button({ label: 'Calculate', variant: 'primary' });
    calculateButton.classList.add('age-cal__calculate');
    const controls = node('<section class="age-cal__controls" aria-label="Age calculator inputs"></section>');
    const controlsHeading = node('<h2 class="age-cal__controls-heading">Enter your dates</h2>');
    const controlsHint = node('<p class="age-cal__controls-hint">Enter dates manually in DD-MM-YYYY format.</p>');
    const calculateRow = node('<div class="age-cal__calculate-row"></div>');
    calculateRow.append(calculateButton);
    controls.append(controlsHeading, controlsHint, dateFields, calculateRow);

    const results = node('<section class="age-cal__result" aria-live="polite" hidden></section>');
    const resultHeader = node('<div class="age-cal__result-heading"><h2>Result</h2></div>');
    const copyButton = button({ label: 'Copy result', variant: 'ghost', disabled: true });
    copyButton.classList.add('age-cal__copy');
    resultHeader.append(copyButton);
    const ageLabel = node('<p class="age-cal__age-label">Age:</p>');
    const ageLines = node('<div class="age-cal__age-lines"></div>');
    results.append(resultHeader, ageLabel, ageLines);
    const feedback = status();

    root.append(controls, results, feedback.el);
    let copyText = '';

    const calculate = () => {
        try {
            const birthIsoDate = toIsoDate(birthDate.input.value);
            const asOfIsoDate = toIsoDate(asOfDate.input.value);
            const age = ageDetailsOn(birthIsoDate, asOfIsoDate);
            const totalWeeks = `${numberFormat.format(age.weeks)} weeks ${age.remainingDays} days`;
            const lines = [
                `${age.years} years ${age.months} months ${age.days} days`,
                ` ${numberFormat.format(age.totalMonths)} months ${age.days} days`,
                ` ${totalWeeks}`,
                ` ${numberFormat.format(age.totalDays)} days`,
                ` ${numberFormat.format(age.hours)} hours`,
                ` ${numberFormat.format(age.minutes)} minutes`,
                ` ${numberFormat.format(age.seconds)} seconds`,
            ];

            ageLines.replaceChildren(...lines.map((line) => {
                const element = node('<p></p>');
                element.textContent = line;
                return element;
            }));
            copyText = ['Age:', ...lines].join('\n');
            results.hidden = false;
            copyButton.disabled = false;
            feedback.set('');
            announce('Age calculated.');
            void complete();
        } catch (error) {
            results.hidden = true;
            ageLines.replaceChildren();
            copyText = '';
            copyButton.disabled = true;
            feedback.set(error.message, 'error');
            announce(error.message);
        }
    };

    calculateButton.addEventListener('click', calculate);
    [birthDate.input, asOfDate.input].forEach((input) => {
        input.addEventListener('input', () => {
            results.hidden = true;
            copyText = '';
            copyButton.disabled = true;
            feedback.set('');
        });
    });
    copyButton.addEventListener('click', async () => {
        if (!copyText) return;

        const copied = await copyToClipboard(copyText);
        feedback.set(
            copied ? 'Age result copied.' : 'Clipboard access is unavailable. Select the result and copy it manually.',
            copied ? 'success' : 'warning',
        );
    });
}
