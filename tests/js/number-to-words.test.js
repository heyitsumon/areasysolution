import test from 'node:test';
import assert from 'node:assert/strict';
import { numberToWords } from '../../resources/js/tools/number-to-words-core.js';

test('converts integers and grouped values into English words', () => {
    assert.equal(numberToWords('0'), 'Zero');
    assert.equal(numberToWords('42'), 'Forty-two');
    assert.equal(numberToWords('1,234,567'), 'One million two hundred thirty-four thousand five hundred sixty-seven');
});

test('preserves decimal zeroes and handles negative values', () => {
    assert.equal(numberToWords('-12.05'), 'Negative twelve point zero five');
    assert.equal(numberToWords('0.00'), 'Zero point zero zero');
    assert.equal(numberToWords('-0'), 'Zero');
});

test('rejects malformed, out-of-range, and excessively precise input', () => {
    assert.throws(() => numberToWords('12,34'), /Enter a number/);
    assert.throws(() => numberToWords('1e6'), /Enter a number/);
    assert.throws(() => numberToWords('1000000000000000'), /largest supported/);
    assert.throws(() => numberToWords(`1.${'1'.repeat(31)}`), /up to 30 digits/);
});
