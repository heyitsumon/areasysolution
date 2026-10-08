import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node } from '../lib/ui';
import { ageDetailsOn } from './calculators-core';

const numberFormat = new Intl.NumberFormat('en-US');

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
    const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/u.exec(displayDate.trim());
    if (!match) throw new Error('Enter dates in DD-MM-YYYY format, for example 07-10-1999.');

    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatLongDate(isoDate) {
    const date = new Date(`${isoDate}T00:00:00Z`);
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function createDateField(labelText, defaultDate = '') {
    const group = node('<div class="age-cal__date-group"></div>');
    const label = node('<label class="age-cal__date-label"></label>');
    label.textContent = labelText;

    const boxes = node('<div class="age-cal__date-boxes"></div>');

    const month = document.createElement('input');
    month.type = 'text';
    month.inputMode = 'numeric';
    month.maxLength = 2;
    month.autocomplete = 'off';
    month.placeholder = 'mm';
    month.className = 'age-cal__date-input';
    month.setAttribute('aria-label', `${labelText} month`);

    const day = document.createElement('input');
    day.type = 'text';
    day.inputMode = 'numeric';
    day.maxLength = 2;
    day.autocomplete = 'off';
    day.placeholder = 'dd';
    day.className = 'age-cal__date-input';
    day.setAttribute('aria-label', `${labelText} day`);

    const year = document.createElement('input');
    year.type = 'text';
    year.inputMode = 'numeric';
    year.maxLength = 4;
    year.autocomplete = 'off';
    year.placeholder = 'yyyy';
    year.className = 'age-cal__date-input';
    year.setAttribute('aria-label', `${labelText} year`);

    const monthBox = node('<div class="age-cal__date-box"></div>');
    monthBox.append(month, node('<small>mm</small>'));

    const dayBox = node('<div class="age-cal__date-box"></div>');
    dayBox.append(day, node('<small>dd</small>'));

    const yearBox = node('<div class="age-cal__date-box"></div>');
    yearBox.append(year, node('<small>yyyy</small>'));

    boxes.append(monthBox, dayBox, yearBox);
    group.append(label, boxes);

    if (defaultDate) {
        const [defaultDay, defaultMonth, defaultYear] = defaultDate.split('-');
        day.value = defaultDay || '';
        month.value = defaultMonth || '';
        year.value = defaultYear || '';
    }

    return {
        el: group,
        month,
        day,
        year,
        values() {
            return {
                month: month.value.trim(),
                day: day.value.trim(),
                year: year.value.trim(),
            };
        },
        clear() {
            month.value = '';
            day.value = '';
            year.value = '';
        },
        inputEls: [month, day, year],
    };
}

export default function mount({ root, announce, complete }) {
    root.classList.add('age-calculator');

    const birthDate = createDateField('Date of Birth');
    const asOfDate = createDateField('Find Age on', toDisplayDate(localDateString()));

    const dateFields = node('<div class="age-cal__date-fields"></div>');
    dateFields.append(birthDate.el, asOfDate.el);

    const clearButton = button({ label: 'Clear', variant: 'secondary' });
    clearButton.classList.add('age-cal__clear');
    const calculateButton = button({ label: 'Calculate', variant: 'primary' });
    calculateButton.classList.add('age-cal__calculate');

    const actionRow = node('<div class="age-cal__action-row"></div>');
    actionRow.append(clearButton, calculateButton);

    const controls = node('<section class="age-cal__controls" aria-label="Age calculator inputs"></section>');
    controls.append(dateFields, actionRow);

    const results = node('<section class="age-cal__result" aria-live="polite" hidden></section>');
    const answerTitle = node('<h2 class="age-cal__answer-title">Answer</h2>');
    const ageLabel = node('<p class="age-cal__result-age-label">Age</p>');
    const ageValue = node('<p class="age-cal__result-age-value"></p>');
    const metaLines = node('<div class="age-cal__meta-lines"></div>');
    const unitLines = node('<div class="age-cal__unit-lines"></div>');
    results.append(answerTitle, ageLabel, ageValue, metaLines, unitLines);

    const feedback = status();
    root.append(controls, results, feedback.el);

    const resetResult = () => {
        results.hidden = true;
        ageValue.textContent = '';
        metaLines.replaceChildren();
        unitLines.replaceChildren();
        feedback.set('');
    };

    const calculate = () => {
        try {
            const birthValues = birthDate.values();
            const asOfValues = asOfDate.values();

            const birthIsoDate = toIsoDate(`${birthValues.day}-${birthValues.month}-${birthValues.year}`);
            const asOfIsoDate = toIsoDate(`${asOfValues.day}-${asOfValues.month}-${asOfValues.year}`);
            const age = ageDetailsOn(birthIsoDate, asOfIsoDate);
            const comparableYears = (age.totalDays / 365.2425).toFixed(3).replace(/\.?0+$/u, '')
                .replace(/\.$/u, '');

            ageValue.textContent = `${age.years} years ${age.months} months ${age.days} days`;

            const meta = [
                `Born on: ${formatLongDate(birthIsoDate)}`,
                `Age on: ${formatLongDate(asOfIsoDate)}`,
                'Age in different time units:',
            ];
            metaLines.replaceChildren(...meta.map((line) => {
                const snippet = node('<p></p>');
                snippet.textContent = line;
                return snippet;
            }));

            const units = [
                `= ${comparableYears} years`,
                `= ${age.years} years ${age.months} months ${age.days} days`,
                `= ${numberFormat.format(age.totalMonths)} months ${age.days} days`,
                `= ${numberFormat.format(age.weeks)} weeks ${age.remainingDays} days`,
                `= ${numberFormat.format(age.totalDays)} days`,
                `≈ ${numberFormat.format(age.hours)} hours*`,
                `≈ ${numberFormat.format(age.minutes)} minutes*`,
                `≈ ${numberFormat.format(age.seconds)} seconds*`,
            ];
            unitLines.replaceChildren(...units.map((line) => {
                const snippet = node('<p></p>');
                snippet.textContent = line;
                return snippet;
            }));

            results.hidden = false;
            announce('Age calculated.');
            void complete();
        } catch (error) {
            resetResult();
            feedback.set(error.message, 'error');
            announce(error.message);
        }
    };

    clearButton.addEventListener('click', () => {
        birthDate.clear();
        asOfDate.clear();
        const today = new Date();
        asOfDate.day.value = String(today.getDate()).padStart(2, '0');
        asOfDate.month.value = String(today.getMonth() + 1).padStart(2, '0');
        asOfDate.year.value = String(today.getFullYear());
        resetResult();
    });

    calculateButton.addEventListener('click', calculate);
    birthDate.inputEls.concat(asOfDate.inputEls).forEach((input) => {
        input.addEventListener('input', () => {
            resetResult();
        });
    });
}
