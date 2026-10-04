import { button, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, panel, select } from '../lib/ui';
import { csvToJson, jsonToCsv } from './csv-json';

const MAX_CHARACTERS = 1_000_000;

export default function mount({ root, complete }) {
    const delimiter = select({
        label: 'CSV delimiter',
        value: ',',
        options: [
            { value: ',', label: 'Comma (,) - standard CSV' },
            { value: ';', label: 'Semicolon (;)' },
            { value: '\t', label: 'Tab-separated' },
        ],
    });
    const input = textarea({
        label: 'Input',
        rows: 12,
        mono: true,
        spellcheck: false,
        placeholder: 'Paste CSV or a JSON array of objects here…',
        hint: 'For CSV to JSON, the first row is used as column names. Values stay as strings.',
    });
    const output = textarea({ label: 'Output', rows: 12, mono: true, spellcheck: false });
    output.textarea.readOnly = true;

    const toJson = button({ label: 'CSV → JSON', variant: 'primary' });
    const toCsv = button({ label: 'JSON → CSV' });
    const copy = button({ label: 'Copy output' });
    const save = button({ label: 'Download output' });
    const feedback = status();
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(toJson, toCsv, copy, save);

    const settings = panel({ title: 'Settings', body: delimiter.el });
    const source = panel({ title: 'Input data', body: input.el });
    source.querySelector('[data-panel-body]').append(actions, feedback.el);
    root.append(settings, source, panel({ title: 'Converted data', body: output.el }));

    function convert(converter, format) {
        if (input.textarea.value.length > MAX_CHARACTERS) {
            feedback.set('For performance and memory safety, input is limited to 1 million characters.', 'warning');
            return;
        }
        if (input.textarea.value.trim() === '') {
            feedback.set('Paste CSV or JSON input first.', 'warning');
            return;
        }

        try {
            output.textarea.value = format(
                converter(input.textarea.value, delimiter.select.value)
            );
            feedback.set('Conversion completed in your browser.', 'success');
            complete();
        } catch (error) {
            feedback.set(error instanceof Error ? error.message : 'The input could not be converted.', 'error');
        }
    }

    toJson.addEventListener('click', () => convert(
        csvToJson,
        (records) => JSON.stringify(records, null, 2),
    ));
    toCsv.addEventListener('click', () => convert(jsonToCsv, (csv) => csv));
    copy.addEventListener('click', async () => {
        if (output.textarea.value === '') {
            feedback.set('Convert some data before copying the output.', 'warning');
            return;
        }

        const copied = await copyToClipboard(output.textarea.value);
        feedback.set(
            copied ? 'Output copied to the clipboard.' : 'Copying was blocked. Select the output and copy it manually.',
            copied ? 'success' : 'warning',
        );
    });
    save.addEventListener('click', () => {
        if (output.textarea.value !== '') {
            download(new Blob([output.textarea.value], { type: 'text/plain;charset=utf-8' }), 'converted-data.txt');
        }
    });
}
