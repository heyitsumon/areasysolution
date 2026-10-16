import { mountFormOutput } from './form-output-shell';

/**
 * Caesar shift cipher. A-Z and a-z rotate; digits rotate 0-9; everything else
 * passes through unchanged.
 */
function shift(text, amount) {
    const normalized = ((amount % 26) + 26) % 26;
    return [...text].map((char) => {
        if (char >= 'A' && char <= 'Z') {
            return String.fromCharCode(((char.charCodeAt(0) - 65 + normalized) % 26) + 65);
        }
        if (char >= 'a' && char <= 'z') {
            return String.fromCharCode(((char.charCodeAt(0) - 97 + normalized) % 26) + 97);
        }
        if (char >= '0' && char <= '9') {
            const digitShift = ((amount % 10) + 10) % 10;
            return String.fromCharCode(((char.charCodeAt(0) - 48 + digitShift) % 10) + 48);
        }
        return char;
    }).join('');
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Caesar cipher encoder & decoder',
        description: 'Encode or decode Caesar shift ciphers with any rotation from 1-25, plus one-click ROT13.',
        fileName: 'caesar-cipher.txt',
        fields: [
            { key: 'input', label: 'Text', type: 'textarea', rows: 6, span: 'full', placeholder: 'Type your message here\u2026' },
            {
                key: 'mode',
                label: 'Mode',
                type: 'select',
                value: 'encode',
                options: [
                    { value: 'encode', label: 'Encode (shift forward)' },
                    { value: 'decode', label: 'Decode (shift backward)' },
                    { value: 'bruteforce', label: 'Brute force (show all 25 shifts)' },
                ],
            },
            { key: 'shift', label: 'Shift amount', type: 'number', value: 3, min: 1, max: 25, step: 1, hint: 'ROT13 = shift 13. Used for encode/decode modes.' },
        ],
        build: (values) => {
            const input = String(values.input);
            if (input.trim() === '') {
                return { text: '', message: 'Type the text to encode or decode.', tone: 'info' };
            }
            const amount = Math.round(Number(values.shift) || 3);
            let result;
            if (values.mode === 'bruteforce') {
                result = Array.from({ length: 25 }, (_, i) => {
                    const key = i + 1;
                    return `Shift ${String(key).padStart(2)}: ${shift(input, -key).slice(0, 120)}`;
                }).join('\n');
            } else {
                result = shift(input, values.mode === 'decode' ? -amount : amount);
            }
            return {
                text: result,
                stats: [
                    { label: 'Mode', value: values.mode === 'bruteforce' ? 'All 25 shifts' : values.mode === 'decode' ? `Decode -${amount}` : `Encode +${amount}` },
                    { label: 'Characters', value: String(input.length) },
                    { label: 'ROT13', value: shift(input, 13).slice(0, 12) + (input.length > 12 ? '\u2026' : '') },
                    { label: 'Alphabet', value: 'A-Z, a-z, 0-9' },
                ],
                message: values.mode === 'bruteforce' ? 'The shift where readable English appears is the original key.' : 'Caesar ciphers are for fun and learning, not real security.',
                tone: 'success',
            };
        },
    });
}
