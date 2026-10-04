import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, number, panel, select } from '../lib/ui';

/**
 * UUID generator.
 *
 * Values come from the Web Crypto API, never Math.random: a "random" UUID built
 * on a predictable PRNG is how two rows end up with the same primary key in
 * production. v7 is offered alongside v4 because time-ordered identifiers keep
 * database indexes dense instead of scattering writes across the tree.
 */

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function stringify(bytes) {
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * @returns {string}
 */
function uuidV4() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);

    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return stringify(bytes);
}

/**
 * UUID v7: 48 bits of Unix milliseconds followed by random bits. Sorting the
 * strings sorts by creation time, which is exactly what a database index wants.
 *
 * @returns {string}
 */
function uuidV7() {
    const bytes = new Uint8Array(16);

    crypto.getRandomValues(bytes);

    const milliseconds = BigInt(Date.now());

    bytes[0] = Number((milliseconds >> 40n) & 0xffn);
    bytes[1] = Number((milliseconds >> 32n) & 0xffn);
    bytes[2] = Number((milliseconds >> 24n) & 0xffn);
    bytes[3] = Number((milliseconds >> 16n) & 0xffn);
    bytes[4] = Number((milliseconds >> 8n) & 0xffn);
    bytes[5] = Number(milliseconds & 0xffn);

    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return stringify(bytes);
}

/**
 * @param {string[]} values
 * @param {string} style
 * @param {boolean} noDashes
 * @returns {string}
 */
function present(values, style, noDashes) {
    const normalised = noDashes ? values.map((value) => value.replace(/-/g, '')) : values;

    switch (style) {
        case 'json':
            return `[\n  ${normalised.map((value) => `"${value}"`).join(',\n  ')}\n]`;
        case 'csv':
            return normalised.join(', ');
        case 'sql':
            return `INSERT INTO table_name (id) VALUES\n${normalised.map((value) => `('${value}')`).join(',\n')};`;
        case 'upper':
            return normalised.map((value) => value.toUpperCase()).join('\n');
        case 'braces':
            return normalised.map((value) => `{${value}}`).join('\n');
        default:
            return normalised.join('\n');
    }
}

export default function mount({ root, announce, complete }) {
    const version = select({
        label: 'Version',
        value: 'v4',
        options: [
            { value: 'v4', label: 'v4 - fully random' },
            { value: 'v7', label: 'v7 - time ordered, better for database keys' },
        ],
    });

    const quantity = number({ label: 'How many', value: 10, min: 1, max: 1000, suffix: 'identifiers' });

    const format = select({
        label: 'Output format',
        value: 'plain',
        options: [
            { value: 'plain', label: 'Plain - one per line' },
            { value: 'upper', label: 'Uppercase' },
            { value: 'braces', label: 'Braces - {xxxxxxxx-...}' },
            { value: 'sql', label: 'SQL INSERT values' },
            { value: 'json', label: 'JSON array' },
            { value: 'csv', label: 'Comma separated' },
        ],
    });

    const noDashes = checkbox({ label: 'Remove dashes', checked: false });

    const settings = node('<div class="mt-4 grid gap-4 sm:grid-cols-3"></div>');

    settings.append(version.el, quantity.el, format.el);

    const output = /** @type {HTMLTextAreaElement} */ (document.createElement('textarea'));

    output.readOnly = true;
    output.rows = 14;
    output.className = 'field-input font-mono text-[13px] leading-relaxed';
    output.setAttribute('aria-label', 'Generated identifiers');

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    const feedback = status();

    const generate = button({ label: 'Generate', variant: 'primary' });
    const copy = button({ label: 'Copy all' });
    const save = button({ label: 'Download .txt' });

    actions.append(generate, copy, save);

    const card = panel({ title: 'Options', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(settings, noDashes.el, actions, feedback.el);

    const outputCard = panel({ title: 'Identifiers', body: node('<div></div>') });
    const outputBody = /** @type {HTMLElement} */ (outputCard.querySelector('[data-panel-body]'));

    outputBody.append(output);

    root.append(
        card,
        outputCard,
        panel({
            title: 'v4 or v7?',
            body: node(`
                <dl class="space-y-3 text-sm">
                    <div>
                        <dt class="font-semibold">Use v4 when</dt>
                        <dd class="prose-tools">You need an opaque public identifier: order references, file names, session keys. Its 122 random bits make collisions and guessing impractical.</dd>
                    </div>
                    <div>
                        <dt class="font-semibold">Use v7 when</dt>
                        <dd class="prose-tools">You are inserting rows at volume. The leading timestamp keeps new rows adjacent in the index, avoiding the page splits that random v4 keys cause.</dd>
                    </div>
                    <div>
                        <dt class="font-semibold">Never treat either as a secret</dt>
                        <dd class="prose-tools">An identifier is not an access token. Always authorise the request against your own data rather than trusting an unguessable value.</dd>
                    </div>
                </dl>
            `),
        }),
    );

    function generateAll() {
        const count = Math.max(1, Math.min(1000, Number(quantity.input.value) || 1));
        const factory = version.select.value === 'v7' ? uuidV7 : uuidV4;
        const values = Array.from({ length: count }, factory);

        output.value = present(values, format.select.value, noDashes.input.checked);
        feedback.set(`Generated ${count} ${version.select.value.toUpperCase()} identifier${count === 1 ? '' : 's'}.`, 'success');
        announce(`${count} identifiers generated.`);
    }

    generate.addEventListener('click', () => {
        generateAll();
        complete();
    });

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(output.value);

        feedback.set(ok ? 'Identifiers copied to your clipboard.' : 'Copying is blocked - select the list and press Ctrl+C.', ok ? 'success' : 'warning');
    });

    save.addEventListener('click', () => {
        download(new Blob([output.value], { type: 'text/plain;charset=utf-8' }), 'uuids.txt');
    });

    [quantity.input, version.select, format.select, noDashes.input].forEach((control) =>
        control.addEventListener('change', () => {
            generateAll();
            complete();
        }));

    generateAll();
}
