import { mountFormOutput } from './form-output-shell';

/**
 * Singular -> plural with the standard English rules plus a compact irregular
 * list. The reverse direction (plural -> singular) handles the same rules in
 * mirror form.
 */
const IRREGULAR = {
    person: 'people', man: 'men', woman: 'women', child: 'children', tooth: 'teeth', foot: 'feet',
    mouse: 'mice', goose: 'geese', ox: 'oxen', leaf: 'leaves', loaf: 'loaves', knife: 'knives',
    wife: 'wives', life: 'lives', shelf: 'shelves', wolf: 'wolves', half: 'halves', calf: 'calves',
    elf: 'elves', datum: 'data', criterion: 'criteria', phenomenon: 'phenomena', index: 'indices',
    matrix: 'matrices', vertex: 'vertices', axis: 'axes', crisis: 'crises', analysis: 'analyses',
};

const IRREGULAR_REVERSE = Object.fromEntries(Object.entries(IRREGULAR).map(([s, p]) => [p, s]));

function toPlural(word) {
    const lower = word.toLowerCase();
    if (IRREGULAR[lower]) return IRREGULAR[lower];
    if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
    if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
    if (/f$/i.test(word) && !/(roof|chief|belief)$/i.test(word)) return `${word.slice(0, -1)}ves`;
    if (/(o)$/i.test(word) && /^(hero|potato|tomato|echo|volcano)/i.test(word)) return `${word}es`;
    return `${word}s`;
}

function toSingular(word) {
    const lower = word.toLowerCase();
    if (IRREGULAR_REVERSE[lower]) return IRREGULAR_REVERSE[lower];
    if (/(ches|shes|xes|zes)$/i.test(word)) return word.slice(0, -2);
    if (/ies$/i.test(word) && word.length > 3) return `${word.slice(0, -3)}y`;
    if (/ves$/i.test(word)) return `${word.slice(0, -3)}f`;
    if (/oes$/i.test(word)) return word.slice(0, -2);
    if (/([^s])s$/i.test(word)) return word.slice(0, -1);
    return word;
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Singular to plural converter',
        description: 'Convert words or a whole list between singular and plural English forms, including irregular nouns.',
        fileName: 'plural-forms.txt',
        fields: [
            {
                key: 'words',
                label: 'Words (one per line, or comma separated)',
                type: 'textarea',
                rows: 8,
                span: 'full',
                placeholder: 'box\nbaby\nknife\nperson',
            },
            {
                key: 'direction',
                label: 'Direction',
                type: 'select',
                value: 'plural',
                options: [
                    { value: 'plural', label: 'Singular \u2192 Plural' },
                    { value: 'singular', label: 'Plural \u2192 Singular' },
                ],
            },
        ],
        build: (values) => {
            const items = String(values.words)
                .split(/[,\n]/)
                .map((w) => w.trim())
                .filter(Boolean);
            if (items.length === 0) {
                return { text: '', message: 'Enter at least one word.', tone: 'info' };
            }
            const convertWord = values.direction === 'plural' ? toPlural : toSingular;
            const lines = items.map((word) => `${word} \u2192 ${convertWord(word)}`);
            return {
                text: lines.join('\n'),
                stats: [
                    { label: 'Words', value: String(items.length) },
                    { label: 'Direction', value: values.direction === 'plural' ? 'S \u2192 P' : 'P \u2192 S' },
                    { label: 'Irregular support', value: String(Object.keys(IRREGULAR).length) },
                    { label: 'Output lines', value: String(lines.length) },
                ],
                message: 'Handles -s/-es/-ies/-ves endings and common irregular nouns like person/people and knife/knives.',
                tone: 'success',
            };
        },
    });
}
