import { mountFormOutput } from './form-output-shell';

const MORSE = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
    i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
    q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
    y: '-.--', z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
    '@': '.--.-.', '-': '-....-', '(': '-.--.', ')': '-.--.-', "'": '.----.',
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([char, code]) => [code, char]));

function encodeMorse(text) {
    return text.toLowerCase().split(/\s+/)
        .map((word) => [...word].map((c) => MORSE[c] ?? '?').join(' '))
        .filter(Boolean)
        .join(' / ');
}

function decodeMorse(code) {
    return code.trim().split(/\s*\/\s*/)
        .map((word) => word.trim().split(/\s+/).map((symbol) => REVERSE[symbol] ?? '?').join(''))
        .join(' ');
}

function playMorse(code) {
    const unit = 0.12;
    const context = new AudioContext();
    let time = context.currentTime;
    for (const symbol of code) {
        const duration = symbol === '.' ? unit : symbol === '-' ? unit * 3 : 0;
        if (duration > 0) {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.frequency.value = 600;
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.setValueAtTime(0.15, time + duration - 0.01);
            gain.gain.setValueAtTime(0, time + duration - 0.01);
            oscillator.start(time);
            oscillator.stop(time + duration);
        }
        time += duration + (symbol === ' ' ? unit * 2 : unit);
    }
    oscillator_finished: {
        setTimeout(() => void context.close(), (time - context.currentTime) * 1000 + 200);
    }
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Morse code translator',
        description: 'Translate text to Morse code and Morse back to text instantly - dots, dashes and word gaps.',
        fileName: 'morse-code.txt',
        fields: [
            { key: 'input', label: 'Text or Morse code', type: 'textarea', rows: 6, span: 'full', placeholder: 'Type English text, or Morse like ".... .. / - .... . .-. ." with dots, dashes, spaces and / between words.' },
            {
                key: 'direction',
                label: 'Direction',
                type: 'select',
                value: 'encode',
                options: [
                    { value: 'encode', label: 'Text \u2192 Morse (auto-detected if blank)' },
                    { value: 'decode', label: 'Morse \u2192 Text' },
                ],
            },
        ],
        build: (values) => {
            const input = String(values.input).trim();
            if (input === '') {
                return { text: '', message: 'Type some text or Morse code above.', tone: 'info' };
            }
            const direction = values.direction === 'encode' || values.direction === 'decode'
                ? values.direction
                : /^[.\-/\s]+$/.test(input) ? 'decode' : 'encode';
            const result = direction === 'encode' ? encodeMorse(input) : decodeMorse(input);
            return {
                text: result,
                stats: [
                    { label: 'Direction', value: direction === 'encode' ? 'Text \u2192 Morse' : 'Morse \u2192 Text' },
                    { label: 'Input length', value: String(input.length) },
                    { label: 'Output length', value: String(result.length) },
                    { label: 'Standard', value: 'International Morse' },
                ],
                message: direction === 'encode'
                    ? 'Words are separated by / and letters by a single space. Copy handles playback of the code.'
                    : 'Unsupported symbols become ?.',
                tone: 'success',
            };
        },
        actions: [
            {
                label: 'Play Morse as sound',
                variant: 'secondary',
                run: (_values, text) => {
                    if (/^[.\-/\s]+$/.test(text)) {
                        playMorse(text);
                    }
                },
            },
        ],
    });
}
