import { button, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, number, panel } from '../lib/ui';

/**
 * Random team generator. Fisher-Yates shuffle with crypto.getRandomValues
 * backing, same fairness approach as the password generator.
 */
function shuffled(list) {
    const array = [...list];
    for (let i = array.length - 1; i > 0; i -= 1) {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        const j = values[0] % (i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export default function mount({ root, complete, announce }) {
    const names = textarea({
        label: 'Names (one per line)',
        rows: 8,
        placeholder: 'Alice\nBob\nCarol\nDave\nEve\nFrank',
        hint: 'One name per line. Blank lines are ignored.',
    });
    const teamCount = number({ label: 'Number of teams', value: 2, min: 2, max: 20, step: 1 });
    const teamSize = number({ label: 'Max players per team (0 = auto)', value: 0, min: 0, max: 100, step: 1 });
    const generate = button({ label: 'Generate teams', variant: 'primary' });
    const copy = button({ label: 'Copy result' });
    const feedback = status();
    const output = document.createElement('pre');
    output.className = 'field-input whitespace-pre-wrap font-mono text-sm';
    output.hidden = true;
    output.setAttribute('aria-live', 'polite');
    let lastText = '';
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(generate, copy);

    root.append(
        panel({ title: 'Players & teams', body: names.el }),
        panel({ title: 'Results', body: node('<div></div>') }),
    );
    root.firstElementChild.querySelector('[data-panel-body]').append(teamCount.el, teamSize.el, actions, feedback.el);
    root.lastElementChild.querySelector('[data-panel-body]').append(output);

    generate.addEventListener('click', () => {
        const people = names.textarea.value.split(/\r?\n/).map((n) => n.trim()).filter(Boolean);
        if (people.length < 2) {
            feedback.set('Enter at least two names, one per line.', 'warning');
            return;
        }
        let teams = Math.round(Number(teamCount.input.value) || 2);
        let maxPerTeam = Math.round(Number(teamSize.input.value) || 0);
        if (maxPerTeam > 0) {
            teams = Math.max(teams, Math.ceil(people.length / maxPerTeam));
        }
        teams = Math.min(teams, people.length);
        const ordered = shuffled(people);
        const buckets = Array.from({ length: teams }, () => []);
        // Snake draft keeps sizes balanced within one player.
        ordered.forEach((name, index) => {
            const cycle = Math.floor(index / teams);
            const pos = index % teams;
            buckets[cycle % 2 === 0 ? pos : teams - 1 - pos].push(name);
        });
        lastText = buckets
            .map((team, i) => `Team ${i + 1} (${team.length}):\n  ${team.join(', ')}`)
            .join('\n\n');
        output.textContent = lastText;
        output.hidden = false;
        feedback.set(`Generated ${teams} teams from ${people.length} players.`, 'success');
        announce(`Generated ${teams} teams.`);
        void complete();
    });

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(lastText);
        feedback.set(ok ? 'Copied to clipboard.' : 'Copying blocked - select the text and press Ctrl+C.', ok ? 'success' : 'warning');
    });
}
