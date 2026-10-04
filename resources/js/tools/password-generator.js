import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, number, panel } from '../lib/ui';

const CHARACTER_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?',
};

function randomIndex(limit) {
    const range = 0x100000000;
    const cutoff = range - (range % limit);
    const values = new Uint32Array(1);

    do {
        crypto.getRandomValues(values);
    } while (values[0] >= cutoff);

    return values[0] % limit;
}

function secureShuffle(characters) {
    for (let index = characters.length - 1; index > 0; index -= 1) {
        const other = randomIndex(index + 1);
        [characters[index], characters[other]] = [characters[other], characters[index]];
    }

    return characters;
}

export default function mount({ root, complete }) {
    const length = number({ label: 'Password length', value: 20, min: 8, max: 128, suffix: 'characters' });
    const options = {
        uppercase: checkbox({ label: 'Uppercase letters (A–Z)', checked: true }),
        lowercase: checkbox({ label: 'Lowercase letters (a–z)', checked: true }),
        numbers: checkbox({ label: 'Numbers (0–9)', checked: true }),
        symbols: checkbox({ label: 'Symbols', checked: true }),
    };
    const excludeAmbiguous = checkbox({
        label: 'Exclude easily confused characters',
        hint: 'Omits O, 0, I, l and similar characters.',
    });

    const settings = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    Object.values(options).forEach((option) => settings.append(option.el));
    settings.append(excludeAmbiguous.el);

    const output = document.createElement('textarea');
    output.readOnly = true;
    output.rows = 3;
    output.className = 'field-input font-mono text-base';
    output.setAttribute('aria-label', 'Generated password');

    const generate = button({ label: 'Generate password', variant: 'primary' });
    const copy = button({ label: 'Copy password' });
    const save = button({ label: 'Download .txt' });
    const feedback = status();
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(generate, copy, save);

    root.append(
        panel({ title: 'Password options', body: node('<div></div>') }),
        panel({ title: 'Your password', body: node('<div></div>') }),
    );
    root.firstElementChild.querySelector('[data-panel-body]').append(length.el, settings, actions, feedback.el);
    root.lastElementChild.querySelector('[data-panel-body]').append(output);

    function createPassword() {
        const pools = Object.entries(options)
            .filter(([name, option]) => option.input.checked)
            .map(([name]) => CHARACTER_SETS[name]);

        if (pools.length === 0) {
            feedback.set('Select at least one character type.', 'warning');
            return false;
        }

        const selectedLength = Number(length.input.value);

        if (! Number.isInteger(selectedLength) || selectedLength < 8 || selectedLength > 128) {
            feedback.set('Choose a password length from 8 to 128 characters.', 'warning');
            return false;
        }

        const blocked = excludeAmbiguous.input.checked ? /[O0Il1]/g : null;
        const usablePools = pools.map((pool) => blocked ? pool.replace(blocked, '') : pool);
        const allCharacters = usablePools.join('');

        if (selectedLength < usablePools.length || allCharacters.length === 0) {
            feedback.set('The selected length is too short for all chosen character types.', 'warning');
            return false;
        }

        const characters = usablePools.map((pool) => pool[randomIndex(pool.length)]);

        while (characters.length < selectedLength) {
            characters.push(allCharacters[randomIndex(allCharacters.length)]);
        }

        output.value = secureShuffle(characters).join('');
        feedback.set('Password generated locally with the browser cryptographic random-number generator.', 'success');
        complete();

        return true;
    }

    generate.addEventListener('click', createPassword);
    copy.addEventListener('click', async () => {
        if (output.value === '') {
            feedback.set('Generate a password first.', 'warning');
            return;
        }

        const copied = await copyToClipboard(output.value);
        feedback.set(
            copied ? 'Password copied to the clipboard.' : 'Copying was blocked. Select the password and copy it manually.',
            copied ? 'success' : 'warning',
        );
    });
    save.addEventListener('click', () => {
        if (output.value !== '') download(new Blob([output.value], { type: 'text/plain;charset=utf-8' }), 'password.txt');
    });

    createPassword();
}
