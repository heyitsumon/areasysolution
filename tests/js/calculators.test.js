import test from 'node:test';
import assert from 'node:assert/strict';
import { ageDetailsOn, ageOn, bmi, gpa, loan, mixedNumberOperation, percentage, tip } from '../../resources/js/tools/calculators-core.js';

test('percentage calculator supports common percentage questions', () => {
    assert.equal(percentage('of', 15, 200), 30);
    assert.equal(percentage('is', 30, 200), 15);
    assert.equal(percentage('change', 100, 125), 25);
    assert.equal(percentage('change', 100, 75), -25);
    assert.throws(() => percentage('is', 3, 0), /must not be zero/);
});

test('BMI returns value and screening category', () => {
    assert.deepEqual(bmi(70, 175), { value: 22.857142857142858, category: 'Healthy range' });
    assert.throws(() => bmi(0, 175), /greater than zero/);
});

test('age calculator handles calendar boundaries and rejects future births', () => {
    assert.deepEqual(ageOn('2000-01-31', '2000-03-01'), { years: 0, months: 1, days: 1 });
    assert.deepEqual(ageOn('2000-06-15', '2026-10-04'), { years: 26, months: 3, days: 19 });
    assert.throws(() => ageOn('2026-10-05', '2026-10-04'), /on or before/);
});

test('age details include exact elapsed totals in common units', () => {
    assert.deepEqual(ageDetailsOn('2000-06-15', '2026-10-04'), {
        years: 26,
        months: 3,
        days: 19,
        totalMonths: 315,
        totalDays: 9607,
        weeks: 1372,
        remainingDays: 3,
        hours: 230568,
        minutes: 13834080,
        seconds: 830044800,
    });
    assert.throws(() => ageDetailsOn('2026-10-05', '2026-10-04'), /on or before/);
});

test('tip calculator splits the total evenly', () => {
    assert.deepEqual(tip(100, 20, 4), { tipAmount: 20, total: 120, perPerson: 30 });
    assert.throws(() => tip(10, 10, 0), /at least one whole person/);
});

test('loan calculator handles zero and positive interest rates', () => {
    assert.deepEqual(loan(1200, 0, 1), { monthlyPayment: 100, totalPaid: 1200, totalInterest: 0 });
    const estimate = loan(20000, 6, 5);
    assert.ok(Math.abs(estimate.monthlyPayment - 386.656) < 0.01);
    assert.ok(estimate.totalInterest > 0);
    assert.throws(() => loan(1000, -1, 2), /cannot be negative/);
});

test('mixed number calculator handles common fraction operations', () => {
    assert.equal(mixedNumberOperation('1 3/4', '2 3/8', 'add'), '4 1/8');
    assert.equal(mixedNumberOperation('1 3/4', '2 3/8', 'subtract'), '-5/8');
    assert.equal(mixedNumberOperation('1 3/4', '2 3/8', 'multiply'), '4 5/32');
    assert.equal(mixedNumberOperation('1 3/4', '2 3/8', 'divide'), '14/19');
    assert.throws(() => mixedNumberOperation('1/2', '0', 'divide'), /divisor cannot be zero/);
});

test('GPA calculator computes weighted average from credits and grades', () => {
    assert.deepEqual(gpa([
        { course: 'Math', credits: 3, grade: 'A' },
        { course: 'English', credits: 3, grade: 'B+' },
        { course: 'History', credits: 2, grade: 'A-' },
    ]), {
        gpa: 3.663,
        totalCredits: 8,
        rows: [
            { course: 'Math', credits: 3, grade: 'A', gradePoints: 12 },
            { course: 'English', credits: 3, grade: 'B+', gradePoints: 9.9 },
            { course: 'History', credits: 2, grade: 'A-', gradePoints: 7.4 },
        ],
    });
    assert.deepEqual(gpa([]), { gpa: 0, totalCredits: 0, rows: [] });
});
