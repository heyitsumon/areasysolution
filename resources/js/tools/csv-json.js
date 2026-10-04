function parseCsv(source, delimiter) {
    const text = source.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let quoteClosed = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (quoted) {
            if (character === '"' && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = false;
                quoteClosed = true;
            } else {
                field += character;
            }
            continue;
        }

        if (quoteClosed) {
            if (character !== delimiter && character !== '\n' && character !== '\r') {
                throw new Error(`Unexpected character after a quoted field at character ${index + 1}.`);
            }
            quoteClosed = false;
        }

        if (character === '"' && field === '') {
            quoted = true;
        } else if (character === delimiter) {
            row.push(field);
            field = '';
        } else if (character === '\n' || character === '\r') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            if (character === '\r' && text[index + 1] === '\n') index += 1;
        } else if (character === '"') {
            throw new Error(`Unexpected quote at character ${index + 1}.`);
        } else {
            field += character;
        }
    }

    if (quoted) throw new Error('A quoted CSV field was not closed.');
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows.filter((values) => values.some((value) => value !== ''));
}

export function csvToJson(source, delimiter) {
    const rows = parseCsv(source, delimiter);
    if (rows.length < 1) throw new Error('Enter a CSV header row and at least one data row.');

    const usedHeaders = new Set();
    const headers = rows[0].map((header, index) => {
        const base = header.trim() || `column_${index + 1}`;
        let candidate = base;
        let suffix = 2;

        while (usedHeaders.has(candidate)) {
            candidate = `${base}_${suffix}`;
            suffix += 1;
        }

        usedHeaders.add(candidate);
        return candidate;
    });

    return rows.slice(1).map((values) => Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ''])
    ));
}

function quoteCsv(value, delimiter) {
    const text = value === null || value === undefined
        ? ''
        : (typeof value === 'object' ? JSON.stringify(value) : String(value));

    return text.includes(delimiter) || /["\r\n]/.test(text) || /^\s|\s$/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
}

export function jsonToCsv(source, delimiter) {
    let records;
    try {
        records = JSON.parse(source);
    } catch (error) {
        throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!Array.isArray(records) || records.length === 0 || records.some((record) => (
        record === null || typeof record !== 'object' || Array.isArray(record)
    ))) {
        throw new Error('Enter a JSON array containing one or more objects.');
    }

    const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
    if (headers.length === 0) throw new Error('The JSON objects do not contain any fields.');

    return [
        headers.map((header) => quoteCsv(header, delimiter)).join(delimiter),
        ...records.map((record) => headers.map((header) => quoteCsv(record[header], delimiter)).join(delimiter)),
    ].join('\r\n');
}
