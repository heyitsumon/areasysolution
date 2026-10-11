import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, panel } from '../lib/ui';

const GRADE_POINTS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

export function calculateGpa(courses) {
    let totalPoints = 0;
    let totalCredits = 0;

    for (const c of courses) {
        const credits = Number(c.credits) || 0;
        const grade = c.grade;
        const points = GRADE_POINTS[grade] ?? 0;

        if (credits > 0) {
            totalPoints += points * credits;
            totalCredits += credits;
        }
    }

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return { gpa, totalCredits, totalPoints };
}

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

