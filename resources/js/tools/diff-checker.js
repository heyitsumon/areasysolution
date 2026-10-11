import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { escapeHtml } from '../lib/dom';
import { node, panel } from '../lib/ui';

function computeDiff(originalLines, modifiedLines) {
    const diff = [];
    const max = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < max; i++) {
        const orig = originalLines[i];
        const mod = modifiedLines[i];

        if (orig === undefined) {
            diff.push({ type: 'added', line: mod, lineNo: i + 1 });
        } else if (mod === undefined) {
            diff.push({ type: 'removed', line: orig, lineNo: i + 1 });
        } else if (orig === mod) {
            diff.push({ type: 'unchanged', line: orig, lineNo: i + 1 });
        } else {
            diff.push({ type: 'removed', line: orig, lineNo: i + 1 });
            diff.push({ type: 'added', line: mod, lineNo: i + 1 });
        }
    }
    return diff;
}

export default function mount({ root, announce, complete }) {
    const leftText = document.createElement('textarea');
    leftText.rows = 8;
    leftText.className = 'field-input font-mono text-xs';
    leftText.placeholder = 'Paste original text here...';
    leftText.value = "The quick brown fox jumps over the lazy dog.\nWeb tools are fast and reliable.\nAntigravity is amazing.";

    const rightText = document.createElement('textarea');
    rightText.rows = 8;
    rightText.className = 'field-input font-mono text-xs';
    rightText.placeholder = 'Paste modified text here...';
    rightText.value = "The fast brown fox jumps over the sleepy dog.\nWeb tools are fast, safe, and reliable.\nAntigravity is amazing.\nEnjoy free online utilities!";

    const compareBtn = button({ label: 'Compare Text', variant: 'primary' });
    const clearBtn = button({ label: 'Clear' });
    const feedback = status();

    const statsBar = node('<div class="flex flex-wrap gap-4 text-xs font-semibold text-slate-600"></div>');
    const diffContainer = node('<div class="rounded-xl border border-slate-200 bg-white overflow-hidden font-mono text-xs"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    const leftCol = node('<div><label class="block text-xs font-bold uppercase text-slate-500 mb-1">Original Text</label></div>');
    leftCol.append(leftText);
    const rightCol = node('<div><label class="block text-xs font-bold uppercase text-slate-500 mb-1">Changed Text</label></div>');
    rightCol.append(rightText);
    inputsGrid.append(leftCol, rightCol);

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(compareBtn, clearBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, actions, feedback.el, statsBar, diffContainer);

    root.append(panel({ title: 'Text Difference Checker', body }));

    function runCompare() {
        const orig = leftText.value.split('\n');
        const mod = rightText.value.split('\n');

        const diff = computeDiff(orig, mod);
        let addedCount = 0;
        let removedCount = 0;
        let unchangedCount = 0;

        diffContainer.replaceChildren();

        diff.forEach((item) => {
            let rowClass = 'bg-white text-slate-800';
            let prefix = ' ';
            let prefixClass = 'text-slate-400';

            if (item.type === 'added') {
                rowClass = 'bg-emerald-50 text-emerald-950 font-medium';
                prefix = '+';
                prefixClass = 'text-emerald-600 font-bold';
                addedCount++;
            } else if (item.type === 'removed') {
                rowClass = 'bg-rose-50 text-rose-950';
                prefix = '-';
                prefixClass = 'text-rose-600 font-bold';
                removedCount++;
            } else {
                unchangedCount++;
            }

            const row = node(`
                <div class="flex items-start border-b border-slate-100 px-3 py-1 ${rowClass}">
                    <span class="w-8 shrink-0 text-right pr-3 text-[10px] text-slate-400 select-none">${item.lineNo}</span>
                    <span class="w-4 shrink-0 text-center ${prefixClass} select-none">${prefix}</span>
                    <span class="flex-1 whitespace-pre-wrap break-all">${escapeHtml(item.line || '')}</span>
                </div>
            `);
            diffContainer.append(row);
        });

        statsBar.innerHTML = `
            <span class="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">+ ${addedCount} Added</span>
            <span class="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">- ${removedCount} Removed</span>
            <span class="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">= ${unchangedCount} Identical</span>
        `;

        feedback.set(`Comparison complete: ${addedCount} additions, ${removedCount} removals.`, 'success');
        announce(`Comparison complete: ${addedCount} additions, ${removedCount} removals.`);
        void complete();
    }

    compareBtn.addEventListener('click', runCompare);
    clearBtn.addEventListener('click', () => {
        leftText.value = '';
        rightText.value = '';
        diffContainer.replaceChildren();
        statsBar.replaceChildren();
        feedback.set('');
    });

    runCompare();
}

