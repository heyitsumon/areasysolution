import { mountFormOutput } from './form-output-shell';

const HEX = '0123456789ABCDEF';

const TABLE = Array.from({ length: 128 }, (_, code) => {
    const char = code < 32 || code === 127 ? '\u00B7' : String.fromCharCode(code);
    const names = {
        0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
        8: 'BS', 9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
        16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
        24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US', 127: 'DEL',
    };
    return {
        code,
        char: names[code] ?? char,
        hex: code.toString(16).toUpperCase().padStart(2, '0'),
        octal: code.toString(8).padStart(3, '0'),
        binary: code.toString(2).padStart(8, '0'),
    };
});

export default function mount(context) {
    mountFormOutput(context, {
        title: 'ASCII table reference',
        description: 'Browse all 128 ASCII characters with decimal, hexadecimal, octal and binary codes. Search by character.',
        fileName: 'ascii-table.txt',
        fields: [
            { key: 'search', label: 'Search (character, decimal, hex or name)', type: 'text', span: 'full', placeholder: 'e.g. A, 65, 0x41, SPACE, NUL' },
        ],
        build: (values) => {
            const query = String(values.search).trim().toLowerCase();
            let rows = TABLE;
            if (query !== '') {
                const asNumber = Number.parseInt(query, query.startsWith('0x') ? 16 : 10);
                rows = TABLE.filter((row) =>
                    row.char.toLowerCase() === query
                    || String(row.code) === query
                    || row.hex.toLowerCase() === query.replace(/^0x/, '')
                    || row.octal === query
                    || row.binary === query
                    || (Number.isFinite(asNumber) && row.code === asNumber));
                if (rows.length === 0) {
                    rows = TABLE.filter((row) => row.char.toLowerCase().includes(query));
                }
            }
            const header = 'DEC  HEX  OCT  BIN      CHAR';
            const body = rows.map((row) => `${String(row.code).padStart(3)}  0x${row.hex}  ${row.octal}  ${row.binary}  ${row.char}`).join('\n');
            return {
                text: `${header}\n${body}`,
                stats: [
                    { label: 'Characters', value: String(rows.length) },
                    { label: 'Search', value: query === '' ? 'Showing all' : `"${query}"` },
                    { label: 'Range', value: '0-127' },
                    { label: 'Encoding', value: 'ASCII / UTF-8' },
                ],
                message: query === '' ? 'Type a character, decimal or hex value in the search box to filter.' : undefined,
                tone: 'success',
            };
        },
    });
}
