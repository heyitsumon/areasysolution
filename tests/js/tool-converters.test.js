import test from 'node:test';
import assert from 'node:assert/strict';
import { csvToJson, jsonToCsv } from '../../resources/js/tools/csv-json.js';

test('CSV to JSON handles quotes, escaped quotes, commas, and newlines', () => {
    const csv = 'name,note\r\n"Avery, A.","said ""hello"""\r\nSam,"line one\nline two"';

    assert.deepEqual(csvToJson(csv, ','), [
        { name: 'Avery, A.', note: 'said "hello"' },
        { name: 'Sam', note: 'line one\nline two' },
    ]);
});

test('CSV to JSON makes blank and duplicate headers unique', () => {
    assert.deepEqual(csvToJson(',name,name\n1,A,B', ','), [
        { column_1: '1', name: 'A', name_2: 'B' },
    ]);
});

test('CSV to JSON avoids collisions with existing suffixed header names', () => {
    assert.deepEqual(csvToJson('name,name_2,name\nA,B,C', ','), [
        { name: 'A', name_2: 'B', name_3: 'C' },
    ]);
});

test('JSON to CSV quotes delimiters and represents nested values as JSON', () => {
    const csv = jsonToCsv('[{"name":"Avery, A.","active":true,"meta":{"level":2}},{"name":"Sam","active":false}]', ',');

    assert.equal(csv, 'name,active,meta\r\n"Avery, A.",true,"{""level"":2}"\r\nSam,false,');
});

test('CSV to JSON rejects unclosed quoted fields', () => {
    assert.throws(() => csvToJson('name,note\nA,"unfinished', ','), /not closed/);
    assert.throws(() => csvToJson('name,note\n"A"x,B', ','), /after a quoted field/);
});

test('JSON to CSV rejects input that is not an array of objects', () => {
    assert.throws(() => jsonToCsv('{"name":"Avery"}', ','), /JSON array/);
});
