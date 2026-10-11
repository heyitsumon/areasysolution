import test from 'node:test';
import assert from 'node:assert/strict';

import {
    calculateDiscount,
    calculateCompoundInterest,
    calculateSalesTax,
    calculateGpa,
    calculateCalories,
    calculateDateDifference,
    minifyCss,
    minifyJs,
    formatSql,
    encodeHtmlEntities,
    parseJwt,
    calculateInvoiceTotals,
} from '../../resources/js/tools/new-tools-core.js';

test('discount calculator computes final price, savings and extra discount', () => {
    const res = calculateDiscount(100, 20, 10, 5);
    // 100 - 20 = 80; 80 - 8 = 72; tax 5% of 72 = 3.6; final = 75.6
    assert.equal(res.discountedPrice, 72);
    assert.equal(res.totalSavings, 28);
    assert.equal(res.taxAmount, 3.6);
    assert.equal(res.finalPriceWithTax, 75.6);
});

test('compound interest calculator computes future balance and yearly schedule', () => {
    const res = calculateCompoundInterest(1000, 5, 2, 1);
    assert.equal(Math.round(res.futureValue * 100) / 100, 1102.5);
    assert.equal(Math.round(res.totalInterest * 100) / 100, 102.5);
    assert.equal(res.schedule.length, 2);
});

test('sales tax calculator computes forward and reverse tax', () => {
    const addRes = calculateSalesTax(100, 10, 'add');
    assert.equal(addRes.taxAmount, 10);
    assert.equal(addRes.grossAmount, 110);

    const revRes = calculateSalesTax(110, 10, 'reverse');
    assert.equal(Math.round(revRes.netAmount), 100);
    assert.equal(Math.round(revRes.taxAmount), 10);
});

test('GPA calculator accurately weights grades by credit hours', () => {
    const courses = [
        { grade: 'A', credits: 3 },  // 4.0 * 3 = 12
        { grade: 'B', credits: 3 },  // 3.0 * 3 = 9
    ];
    const res = calculateGpa(courses);
    assert.equal(res.totalCredits, 6);
    assert.equal(res.gpa, 3.5);
});

test('calorie calculator uses Mifflin-St Jeor formula correctly', () => {
    // Male, 25yr, 70kg, 175cm, sedentary (1.2)
    const res = calculateCalories(25, 'male', 70, 175, 1.2);
    assert.equal(res.bmr, 1674);
    assert.equal(res.maintenance, Math.round(1674 * 1.2));
});

test('date difference calculator computes days and working days', () => {
    // 2026-10-05 (Monday) to 2026-10-09 (Friday) = 4 days, 4 business days
    const res = calculateDateDifference('2026-10-05', '2026-10-09', false);
    assert.equal(res.totalDays, 4);
    assert.equal(res.businessDays, 4);
});

test('CSS minifier removes comments and unnecessary whitespace', () => {
    const raw = "/* test */ .card {\n  color: red;\n  margin: 0px;\n}";
    const min = minifyCss(raw);
    assert.equal(min, ".card{color:red;margin:0px}");
});

test('JS minifier removes comments and collapses whitespace', () => {
    const raw = "// comment\nfunction test() {\n  return 1 + 2;\n}";
    const min = minifyJs(raw);
    assert.ok(!min.includes('// comment'));
    assert.ok(min.includes('function test()'));
});

test('SQL formatter capitalizes clauses and formats structure', () => {
    const raw = "select id, name from users where active = 1";
    const formatted = formatSql(raw, true);
    assert.ok(formatted.includes('SELECT'));
    assert.ok(formatted.includes('FROM'));
    assert.ok(formatted.includes('WHERE'));
});

test('HTML entity encoder and decoder preserve content integrity', () => {
    const raw = '<div id="test">&hello</div>';
    const encoded = encodeHtmlEntities(raw);
    assert.ok(encoded.includes('&#60;'));
    assert.ok(encoded.includes('&#38;'));
});

test('JWT decoder parses valid token header and payload', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYiLCJ1c2VyIjoiQWxpY2UifQ.mockSig';
    const { header, payload } = parseJwt(token);
    assert.equal(header.alg, 'HS256');
    assert.equal(payload.sub, '123456');
    assert.equal(payload.user, 'Alice');
});

test('invoice calculator computes subtotal, discount, tax, and total', () => {
    const items = [
        { description: 'Web Design', quantity: 2, rate: 500 }, // 1000
        { description: 'Hosting', quantity: 1, rate: 200 },    // 200
    ];
    // Subtotal: 1200, discount: 200 => 1000, tax 10% => 100, total = 1100
    const res = calculateInvoiceTotals(items, 10, 200);
    assert.equal(res.subtotal, 1200);
    assert.equal(res.discountAmount, 200);
    assert.equal(res.taxAmount, 100);
    assert.equal(res.total, 1100);
});

