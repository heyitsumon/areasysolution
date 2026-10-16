import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, panel } from '../lib/ui';

/**
 * Scientific calculator.
 *
 * A real expression evaluator — not an eval() shortcut. Shunting-yard converts
 * the infix input (with implicit multiplication for things like `2π` or `3(4+1)`)
 * to postfix, then a stack machine evaluates it. Degrees/radians switch changes
 * how the trig functions interpret their argument, exactly like the hardware
 * calculators people already know.
 */

const MAX_EXPRESSION_LENGTH = 120;

/* ------------------------------------------------------------------ tokens */

const FUNCTIONS = new Set([
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh',
    'log', 'ln', 'log2', 'sqrt', 'cbrt', 'abs', 'exp',
]);

const CONSTANTS = new Set(['pi', 'e']);

const PRECEDENCE = {
    '+': 1, '-': 1,
    '*': 2, '/': 2, '%': 2, 'mod': 2,
    '^': 4,
};

const RIGHT_ASSOC = new Set(['^']);

/* ------------------------------------------------------------- tokenizer */

function tokenize(raw) {
    const src = raw
        .toLowerCase()
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/,/g, '')
        .trim();

    const tokens = [];
    let i = 0;

    while (i < src.length) {
        const char = src[i];

        if (char === ' ') {
            i += 1;
            continue;
        }

        if (/[0-9.]/.test(char)) {
            let numberText = '';
            while (i < src.length && /[0-9.]/.test(src[i])) {
                numberText += src[i];
                i += 1;
            }
            if ((numberText.match(/\./g) ?? []).length > 1) {
                throw new Error(`Malformed number “${numberText}”.`);
            }
            tokens.push({ type: 'number', value: Number(numberText) });
            continue;
        }

        if (/[a-z]/.test(char)) {
            let word = '';
            while (i < src.length && /[a-z0-9]/.test(src[i])) {
                word += src[i];
                i += 1;
            }
            // Longest-known-name-first match handles `log2` before `log`.
            const match = [...FUNCTIONS].sort((a, b) => b.length - a.length)
                .find((name) => word.startsWith(name))
                ?? [...CONSTANTS].find((name) => word === name);

            if (!match) {
                throw new Error(`Unknown function or constant “${word}”.`);
            }
            if (CONSTANTS.has(word) && word.length > match.length) {
                throw new Error(`Unknown constant “${word}”.`);
            }
            tokens.push(CONSTANTS.has(match) ? { type: 'constant', value: match } : { type: 'function', value: match });
            continue;
        }

        if ('+-*/^()!'.includes(char)) {
            // A `-` is unary when it starts the expression, follows an operator
            // (`2*(-3)`, `--5`) or a function call (`sin(-1)`) — never when it
            // follows a value (`5-3` is binary).
            const previousToken = tokens[tokens.length - 1];
            const previousIsValue = previousToken !== undefined
                && (previousToken.type === 'number' || previousToken.type === 'constant'
                    || (previousToken.type === 'operator' && (previousToken.value === ')' || previousToken.value === '!')));

            if (char === '-' && !previousIsValue) {
                tokens.push({ type: 'operator', value: 'u-' });
                i += 1;
                continue;
            }

            tokens.push({ type: 'operator', value: char });
            i += 1;
            continue;
        }

        throw new Error(`Unexpected character “${char}”.`);
    }

    return tokens;
}

/* ------------------------------------------------------- shunting-yard */

function toPostfix(tokens) {
    const output = [];
    const stack = [];
    let previous = null;

    for (const token of tokens) {
        const startsValue = token.type === 'number' || token.type === 'constant' || token.type === 'function'
            || (token.type === 'operator' && token.value === '(');
        const previousEndsValue = previous !== null
            && (previous.type === 'number' || previous.type === 'constant'
                || (previous.type === 'operator' && (previous.value === ')' || previous.value === '!')));

        // Implicit multiplication: `2π`, `3(4+1)`, `(2)(3)`, `2sin(1)`.
        if (startsValue && previousEndsValue) {
            stackPush(stack, { type: 'operator', value: '*' }, output);
        }

        if (token.type === 'number' || token.type === 'constant') {
            output.push(token);
        } else if (token.type === 'function') {
            stack.push(token);
        } else if (token.value === '(') {
            stack.push(token);
        } else if (token.value === ')') {
            let foundOpen = false;
            while (stack.length > 0) {
                const top = stack.pop();
                if (top.value === '(' && top.type === 'operator') { foundOpen = true; break; }
                output.push(top);
            }
            if (!foundOpen) throw new Error('Unbalanced parentheses.');
            if (stack.length > 0 && stack[stack.length - 1].type === 'function') {
                output.push(stack.pop());
            }
        } else {
            stackPush(stack, token, output);
        }

        previous = token;
    }

    while (stack.length > 0) {
        const top = stack.pop();
        if (top.type === 'operator' && top.value === '(') {
            throw new Error('Unbalanced parentheses.');
        }
        output.push(top);
    }

    return output;
}

function stackPush(stack, token, output) {
    while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'operator' && top.value !== '(') {
            const topPrecedence = PRECEDENCE[top.value] ?? 3;
            const precedence = PRECEDENCE[token.value];
            if (topPrecedence > precedence || (topPrecedence === precedence && !RIGHT_ASSOC.has(token.value))) {
                output.push(stack.pop());
                continue;
            }
        }
        break;
    }
    stack.push(token);
}

/* ------------------------------------------------------------ evaluation */

function factorial(n) {
    if (!Number.isInteger(n) || n < 0) {
        throw new Error('Factorial needs a non-negative whole number.');
    }
    if (n > 170) throw new Error('Factorial is too large (max 170!).');
    let result = 1;
    for (let k = 2; k <= n; k += 1) result *= k;
    return result;
}

function evaluate(postfix, { degrees }) {
    const stack = [];
    const toRadians = (value) => (degrees ? value * Math.PI / 180 : value);
    const fromRadians = (value) => (degrees ? value * 180 / Math.PI : value);

    for (const token of postfix) {
        if (token.type === 'number') {
            stack.push(token.value);
            continue;
        }
        if (token.type === 'constant') {
            stack.push(token.value === 'pi' ? Math.PI : Math.E);
            continue;
        }
        if (token.type === 'function') {
            const argument = stack.pop();
            if (argument === undefined) throw new Error('Incomplete expression.');
            const table = {
                sin: () => Math.sin(toRadians(argument)),
                cos: () => Math.cos(toRadians(argument)),
                tan: () => Math.tan(toRadians(argument)),
                asin: () => (Math.abs(argument) > 1 ? NaN : fromRadians(Math.asin(argument))),
                acos: () => (Math.abs(argument) > 1 ? NaN : fromRadians(Math.acos(argument))),
                atan: () => fromRadians(Math.atan(argument)),
                sinh: () => Math.sinh(argument),
                cosh: () => Math.cosh(argument),
                tanh: () => Math.tanh(argument),
                log: () => Math.log10(argument),
                ln: () => Math.log(argument),
                log2: () => Math.log2(argument),
                sqrt: () => (argument < 0 ? NaN : Math.sqrt(argument)),
                cbrt: () => Math.cbrt(argument),
                abs: () => Math.abs(argument),
                exp: () => Math.exp(argument),
            };
            const result = table[token.value]();
            if (Number.isNaN(result)) throw new Error(`${token.value}(${formatNumber(argument)}) is undefined.`);
            stack.push(result);
            continue;
        }

        if (token.value === '!') {
            const value = stack.pop();
            if (value === undefined) throw new Error('Incomplete expression.');
            stack.push(factorial(value));
            continue;
        }
        if (token.value === 'u-') {
            const value = stack.pop();
            if (value === undefined) throw new Error('Incomplete expression.');
            stack.push(-value);
            continue;
        }

        const right = stack.pop();
        const left = stack.pop();
        if (left === undefined || right === undefined) throw new Error('Incomplete expression.');
        switch (token.value) {
            case '+': stack.push(left + right); break;
            case '-': stack.push(left - right); break;
            case '*': stack.push(left * right); break;
            case '/':
                if (right === 0) throw new Error('Division by zero.');
                stack.push(left / right);
                break;
            case '%': stack.push(left % right); break;
            case 'mod': stack.push(left % right); break;
            case '^': stack.push(left ** right); break;
            default: throw new Error(`Unknown operator “${token.value}”.`);
        }
    }

    if (stack.length !== 1) throw new Error('Incomplete expression.');
    const result = stack[0];
    if (!Number.isFinite(result)) throw new Error('The result is too large to display.');
    return result;
}

/* ---------------------------------------------------------------- UI */

function formatNumber(value) {
    if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
    if (Math.abs(value) >= 1e15 || (Math.abs(value) < 1e-9 && value !== 0)) {
        return value.toExponential(9).replace(/\.?0+e/, 'e');
    }
    return String(Number(value.toPrecision(12)));
}

const KEYPAD = [
    ['sin(', 'cos(', 'tan(', '(', ')'],
    ['π', 'e', 'log(', 'ln(', '√('],
    ['x²', 'xʸ', '|x|', 'n!', 'mod'],
    ['C', '⌫', '%', '÷', '×'],
    ['7', '8', '9', '-', '+'],
    ['4', '5', '6', '(', ')'],
    ['1', '2', '3', '=', '0'],
];

const KEY_ACTIONS = {
    'C': { kind: 'clear' },
    '⌫': { kind: 'backspace' },
    '=': { kind: 'equals' },
    'x²': { kind: 'insert', text: '^2' },
    'xʸ': { kind: 'insert', text: '^' },
    '√(': { kind: 'insert', text: 'sqrt(' },
    '|x|': { kind: 'insert', text: 'abs(' },
    'n!': { kind: 'insert', text: '!' },
    'π': { kind: 'insert', text: 'pi' },
    'e': { kind: 'insert', text: 'e' },
};

export default function mount({ root, announce, complete }) {
    const display = node(`<input class="sci-display" type="text" inputmode="text" autocomplete="off" spellcheck="false" aria-label="Calculator expression" placeholder="e.g. sin(45) + 5² × 2">`);
    const angleToggle = node(`
        <div class="sci-angle" role="group" aria-label="Angle unit">
            <button type="button" data-angle="deg" class="sci-angle-btn" aria-pressed="true">DEG</button>
            <button type="button" data-angle="rad" class="sci-angle-btn" aria-pressed="false">RAD</button>
        </div>
    `);
    const keypad = node('<div class="sci-keypad" role="group" aria-label="Calculator keypad"></div>');
    const resultBox = node('<div class="sci-result" role="status" aria-live="polite">Enter an expression and press = or Enter.</div>');
    const feedback = status();

    let degrees = true;
    let history = [];

    const historyBox = node('<div class="sci-history" aria-label="Calculation history"></div>');

    for (const row of KEYPAD) {
        for (const key of row) {
            const keyButton = button({ label: key, variant: ['C', '='].includes(key) ? 'primary' : 'secondary' });
            keyButton.classList.add('sci-key');
            if (key === '=') keyButton.classList.add('sci-key--equals');
            keyButton.addEventListener('click', () => handleKey(key));
            keypad.append(keyButton);
        }
    }

    const controlsPanel = panel({ title: 'Scientific Calculator', description: 'Type or tap an expression. Trig functions follow the DEG/RAD switch.' });
    const resultPanel = panel({ title: 'Result' });
    root.append(controlsPanel, resultPanel);

    controlsPanel.querySelector('[data-panel-body]').append(angleToggle, display, keypad);
    resultPanel.querySelector('[data-panel-body]').append(resultBox, feedback.el, historyBox);

    display.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            evaluateExpression();
        }
    });

    for (const angleButton of angleToggle.querySelectorAll('[data-angle]')) {
        angleButton.addEventListener('click', () => {
            degrees = angleButton.dataset.angle === 'deg';
            angleToggle.querySelectorAll('[data-angle]').forEach((b) => b.setAttribute('aria-pressed', String(b === angleButton)));
            announce(`Angle unit set to ${degrees ? 'degrees' : 'radians'}.`);
        });
    }

    function insertText(text) {
        if (display.value.length + text.length > MAX_EXPRESSION_LENGTH) return;
        display.value += text;
    }

    function handleKey(key) {
        const action = KEY_ACTIONS[key] ?? { kind: 'insert', text: key };
        if (action.kind === 'clear') {
            display.value = '';
            resultBox.textContent = 'Cleared. Enter a new expression.';
            return;
        }
        if (action.kind === 'backspace') {
            display.value = display.value.slice(0, -1);
            return;
        }
        if (action.kind === 'equals') {
            evaluateExpression();
            return;
        }
        insertText(action.text);
        display.focus();
    }

    function evaluateExpression() {
        const raw = display.value.trim();
        if (raw === '') {
            feedback.set('Type an expression first, for example sin(30) × 2.', 'warning');
            return;
        }
        try {
            const tokens = tokenize(raw);
            const postfix = toPostfix(tokens);
            const value = evaluate(postfix, { degrees });
            const formatted = formatNumber(value);
            resultBox.innerHTML = '';
            const valueNode = node(`<p class="sci-result-value">${formatted.replace(/</g, '&lt;')}</p>`);
            const metaNode = node(`<p class="sci-result-meta">${escapeAttr(raw)} — ${degrees ? 'degrees' : 'radians'}</p>`);
            resultBox.append(valueNode, metaNode);
            feedback.set(`Result: ${formatted}`, 'success');
            announce(`The result is ${formatted}.`);
            void complete();
            history = [{ expression: raw, value: formatted }, ...history].slice(0, 12);
            renderHistory();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'The expression could not be evaluated.';
            feedback.set(message, 'error');
            announce(message);
        }
    }

    function renderHistory() {
        historyBox.innerHTML = '';
        for (const entry of history) {
            const row = node(`<div class="sci-history-row"><span class="sci-history-expression">${escapeAttr(entry.expression)}</span><span class="sci-history-value">= ${entry.value}</span></div>`);
            historyBox.append(row);
        }
    }

    function escapeAttr(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
