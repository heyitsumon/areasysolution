import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node } from '../lib/ui';
import { gpa } from './calculators-core';

export default function mount({ root, announce, complete }) {
    const coursesList = node('<div class="space-y-3"></div>');
    const addCourseBtn = button({ label: '+ Add Course' });
    const calcBtn = button({ label: 'Calculate GPA', variant: 'primary' });
    const feedback = status();

    const resultCard = node(`
        <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 text-center mt-4">
            <p class="text-xs font-semibold uppercase text-indigo-700">Cumulative Grade Point Average</p>
            <p class="text-4xl font-extrabold text-indigo-950 mt-1" data-gpa-val>0.00</p>
            <p class="text-xs text-indigo-600 mt-1" data-gpa-sub>Based on 0 total credit hours</p>
        </div>
    `);

    const actions = node('<div class="flex flex-wrap gap-2 mt-4"></div>');
    actions.append(addCourseBtn, calcBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<p class="text-xs text-slate-500">Enter your courses, grade received, and credit hours:</p>'),
        coursesList,
        actions,
        feedback.el,
        resultCard
    );

    root.append(panel({ title: 'College & High School GPA Calculator', body }));

    function addCourseRow(name = '', grade = 'A', credits = 3) {
        const row = node(`
            <div class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3" data-course-row>
                <input type="text" placeholder="Course name (e.g. English 101)" value="${name}" class="field-input flex-1 min-w-36 text-xs" data-course-name>
                <select class="field-input w-28 text-xs font-bold" data-course-grade>
                    ${Object.keys(GRADE_POINTS).map((g) => `<option value="${g}" ${g === grade ? 'selected' : ''}>${g} (${GRADE_POINTS[g].toFixed(1)})</option>`).join('')}
                </select>
                <input type="number" min="0.5" max="12" step="0.5" value="${credits}" class="field-input w-24 text-xs font-semibold" data-course-credits placeholder="Credits">
                <button type="button" class="text-slate-400 hover:text-rose-600 px-2 py-1 text-sm font-bold" title="Delete course" data-delete-row>×</button>
            </div>
        `);

        row.querySelector('[data-delete-row]').addEventListener('click', () => {
            if (coursesList.querySelectorAll('[data-course-row]').length > 1) {
                row.remove();
                run();
            }
        });

        row.querySelectorAll('input, select').forEach((el) => el.addEventListener('input', run));
        coursesList.append(row);
    }

    addCourseBtn.addEventListener('click', () => {
        addCourseRow('', 'A', 3);
    });

    function run() {
        const rows = coursesList.querySelectorAll('[data-course-row]');
        const courses = [];

        rows.forEach((r) => {
            const grade = r.querySelector('[data-course-grade]').value;
            const credits = Number(r.querySelector('[data-course-credits]').value) || 0;
            courses.push({ grade, credits });
        });

        const res = calculateGpa(courses);
        resultCard.querySelector('[data-gpa-val]').textContent = res.gpa.toFixed(2);
        resultCard.querySelector('[data-gpa-sub]').textContent = `Based on ${res.totalCredits} credit hours (${res.totalPoints.toFixed(1)} grade points)`;

        announce(`GPA calculated: ${res.gpa.toFixed(2)}.`);
        void complete();
    }

    calcBtn.addEventListener('click', run);

    // Initial 4 sample courses
    addCourseRow('Mathematics', 'A', 4);
    addCourseRow('Computer Science', 'A-', 3);
    addCourseRow('Physics', 'B+', 4);
    addCourseRow('History', 'A', 3);

    run();
}

=======
import { node } from '../lib/ui';
import { gpa } from './calculators-core';

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

function createCourseRow(course = '', credits = 3, grade = 'A') {
    const row = node('<tr class="gpa-cal__row"></tr>');
    const nameCell = node('<td class="gpa-cal__cell gpa-cal__cell--title"></td>');
    const creditCell = node('<td class="gpa-cal__cell"></td>');
    const gradeCell = node('<td class="gpa-cal__cell"></td>');
    const pointsCell = node('<td class="gpa-cal__cell gpa-cal__cell--points"></td>');

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = course;
    nameInput.placeholder = 'Course';
    nameInput.className = 'gpa-cal__input';
    nameInput.setAttribute('aria-label', 'Course name');
    nameCell.append(nameInput);

    const creditInput = document.createElement('input');
    creditInput.type = 'number';
    creditInput.min = '1';
    creditInput.step = '1';
    creditInput.value = String(credits);
    creditInput.className = 'gpa-cal__input gpa-cal__input--numeric';
    creditInput.setAttribute('aria-label', 'Course credits');
    creditCell.append(creditInput);

    const gradeSelect = document.createElement('select');
    gradeSelect.className = 'gpa-cal__select';
    gradeSelect.setAttribute('aria-label', 'Course grade');
    GRADE_OPTIONS.forEach((optionValue) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        option.selected = optionValue === grade;
        gradeSelect.append(option);
    });
    gradeCell.append(gradeSelect);

    const points = node('<span class="gpa-cal__points"></span>');
    const gradePointValue = Number(credits) * (Number.parseFloat({ A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0 }[grade]) || 0);
    points.textContent = Number.isFinite(gradePointValue) ? gradePointValue.toFixed(1) : '0.0';
    pointsCell.append(points);

    row.append(nameCell, creditCell, gradeCell, pointsCell);

    const onChange = () => {
        const courseName = nameInput.value.trim() || 'Course';
        const creditValue = Number(creditInput.value || 0);
        const gradeValue = gradeSelect.value;
        const pointValue = Number(creditValue) * (Number.parseFloat({ A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0 }[gradeValue]) || 0);

        nameInput.placeholder = courseName || 'Course';
        if (creditValue > 0) {
            points.textContent = Number.isFinite(pointValue) ? pointValue.toFixed(1) : '0.0';
        } else {
            points.textContent = '0.0';
        }
    };

    nameInput.addEventListener('input', onChange);
    creditInput.addEventListener('input', onChange);
    gradeSelect.addEventListener('change', onChange);

    return { row, nameInput, creditInput, gradeSelect, points };
}

export default function mount({ root, announce, complete }) {
    const state = [
        { course: 'Math', credits: 3, grade: 'A' },
        { course: 'English', credits: 3, grade: 'B+' },
        { course: 'History', credits: 2, grade: 'A-' },
    ];

    const wrapper = node('<div class="gpa-calculator"></div>');
    const heading = node('<div class="gpa-cal__summary"></div>');
    const gpaValue = node('<div class="gpa-cal__gpa">GPA: <span>3.663</span></div>');
    const totalCredits = node('<div class="gpa-cal__credits">Total Credits: <span>8</span></div>');
    heading.append(gpaValue, totalCredits);

    const tableWrap = node('<div class="gpa-cal__table-wrap"></div>');
    const table = node('<table class="gpa-cal__table"></table>');
    const thead = node('<thead class="gpa-cal__head"></thead>');
    thead.innerHTML = '<tr><th>Course</th><th>Credit</th><th>Grade</th><th>Grade Points</th></tr>';

    const tbody = node('<tbody></tbody>');
    const totalRow = node('<tfoot class="gpa-cal__foot"></tfoot>');
    const totalCreditsRow = node('<tr><td colspan="3" class="gpa-cal__foot-label">Total Credits</td><td class="gpa-cal__foot-value">8</td></tr>');
    const overallRow = node('<tr class="gpa-cal__overall"><td colspan="3" class="gpa-cal__foot-label">Overall GPA</td><td class="gpa-cal__foot-value">3.663</td></tr>');
    totalRow.append(totalCreditsRow, overallRow);

    table.append(thead, tbody, totalRow);
    tableWrap.append(table);

    const formPanel = node('<div class="gpa-cal__editor"></div>');
    const inputTable = node('<table class="gpa-cal__editor-table"></table>');
    const editorHead = node('<thead><tr><th>Course (optional)</th><th>Credits</th><th>Grade</th></tr></thead>');
    const editorBody = node('<tbody></tbody>');
    inputTable.append(editorHead, editorBody);
    formPanel.append(inputTable);

    const addButton = button({ label: '+ add more courses', variant: 'secondary' });
    addButton.classList.add('gpa-cal__add-button');
    formPanel.append(addButton);

    const feedback = status();
    wrapper.append(heading, tableWrap, formPanel, feedback.el);

    const gradePointsMap = { A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0 };

    const renderCourseEditor = () => {
        editorBody.replaceChildren();
        state.forEach((entry) => {
            const row = node('<tr class="gpa-cal__editor-row"></tr>');
            const nameCell = node('<td></td>');
            const creditCell = node('<td></td>');
            const gradeCell = node('<td></td>');

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = entry.course ?? '';
            nameInput.placeholder = 'Math';
            nameInput.className = 'gpa-cal__editor-input';

            const creditsInput = document.createElement('input');
            creditsInput.type = 'number';
            creditsInput.min = '1';
            creditsInput.value = String(entry.credits ?? 1);
            creditsInput.step = '1';
            creditsInput.className = 'gpa-cal__editor-input gpa-cal__editor-input--numeric';

            const gradeSelect = document.createElement('select');
            gradeSelect.className = 'gpa-cal__editor-select';
            GRADE_OPTIONS.forEach((grade) => {
                const option = document.createElement('option');
                option.value = grade;
                option.textContent = grade;
                option.selected = entry.grade === grade;
                gradeSelect.append(option);
            });

            nameCell.append(nameInput);
            creditCell.append(creditsInput);
            gradeCell.append(gradeSelect);
            row.append(nameCell, creditCell, gradeCell);
            editorBody.append(row);

            nameInput.addEventListener('input', () => {
                entry.course = nameInput.value;
                updateSummary();
            });
            creditsInput.addEventListener('input', () => {
                entry.credits = Number(creditsInput.value) || 0;
                updateSummary();
            });
            gradeSelect.addEventListener('change', () => {
                entry.grade = gradeSelect.value;
                updateSummary();
            });
        });
    };

    const updateSummary = () => {
        const validRows = state.filter((course) => Number(course.credits) > 0 && gradePointsMap[course.grade] !== undefined);
        const totalCreditsValue = validRows.reduce((sum, course) => sum + Number(course.credits), 0);
        const computed = gpa(validRows);
        const gpaValueNumber = totalCreditsValue ? Number(computed.gpa.toFixed(3)) : 0;

        const summaryRows = validRows.map((course) => {
            const row = createCourseRow(course.course ?? 'Course', Number(course.credits) || 0, course.grade ?? 'A');
            const pointValue = (gradePointsMap[course.grade] ?? 0) * Number(course.credits || 0);
            row.points.textContent = pointValue.toFixed(1);
            return row.row;
        });

        tbody.replaceChildren(...summaryRows);
        totalCreditsRow.querySelector('.gpa-cal__foot-value').textContent = String(totalCreditsValue || 0);
        overallRow.querySelector('.gpa-cal__foot-value').textContent = gpaValueNumber.toFixed(3);
        gpaValue.querySelector('span').textContent = gpaValueNumber.toFixed(3);
        totalCredits.querySelector('span').textContent = String(totalCreditsValue || 0);
        announce('GPA updated.');
        void complete();
    };

    addButton.addEventListener('click', () => {
        state.push({ course: '', credits: 3, grade: 'A' });
        renderCourseEditor();
        updateSummary();
    });

    renderCourseEditor();
    updateSummary();
    root.append(wrapper);
}
>>>>>>> a24b0eb03ec88c48d172b2f0dff614d955c64da9
