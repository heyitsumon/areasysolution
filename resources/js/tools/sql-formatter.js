import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel } from '../lib/ui';

const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
    'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE',
    'ALTER TABLE', 'UNION', 'UNION ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'AS', 'ON', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL', 'LIKE', 'BETWEEN', 'EXISTS',
];

export function formatSql(sql, uppercase = true) {
    if (!sql.trim()) return '';

    let formatted = sql.replace(/\s+/g, ' ').trim();

    // Line break keywords
    const majorClauses = [
        'SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN',
        'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION',
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    ];

    majorClauses.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, (match) => `\n${uppercase ? match.toUpperCase() : match.toLowerCase()}`);
    });

    const subClauses = ['AND', 'OR', 'ON'];
    subClauses.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, (match) => `\n  ${uppercase ? match.toUpperCase() : match.toLowerCase()}`);
    });

    if (uppercase) {
        SQL_KEYWORDS.forEach((kw) => {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            formatted = formatted.replace(regex, (m) => m.toUpperCase());
        });
    }

    return formatted.trim();
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 8;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Paste your raw SQL query here...';
    input.value = "select u.id, u.name, o.total_amount, o.created_at from users u left join orders o on u.id = o.user_id where u.active = 1 and o.total_amount > 50 order by o.created_at desc limit 10";

    const output = document.createElement('textarea');
    output.rows = 10;
    output.readOnly = true;
    output.className = 'field-input font-mono text-xs';

    const uppercaseBox = checkbox({
        label: 'Uppercase standard SQL keywords (SELECT, FROM, etc.)',
        checked: true,
    });

    const formatBtn = button({ label: 'Format SQL', variant: 'primary' });
    const copyBtn = button({ label: 'Copy Formatted SQL' });
    const clearBtn = button({ label: 'Clear' });
    const feedback = status();

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(formatBtn, copyBtn, clearBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Raw SQL</label>'),
        input,
        uppercaseBox.el,
        actions,
        feedback.el,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Beautified & Indented SQL</label>'),
        output
    );

    root.append(panel({ title: 'SQL Query Formatter & Beautifier', body }));

    function run() {
        const raw = input.value;
        const isUpper = uppercaseBox.input.checked;
        output.value = formatSql(raw, isUpper);
        feedback.set('Formatted SQL query.', 'success');
        announce('Formatted SQL.');
        void complete();
    }

    formatBtn.addEventListener('click', run);
    uppercaseBox.input.addEventListener('change', run);

    copyBtn.addEventListener('click', () => {
        if (!output.value) run();
        copyToClipboard(output.value);
        feedback.set('Copied formatted SQL to clipboard!', 'success');
        announce('Copied SQL.');
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        output.value = '';
        feedback.set('');
    });

    run();
}

