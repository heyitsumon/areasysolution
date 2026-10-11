import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { escapeHtml } from '../lib/dom';
import { node, panel } from '../lib/ui';

function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return decodeURIComponent(
        atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
}

export function parseJwt(token) {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format: A valid token must have 3 dot-separated parts (Header.Payload.Signature).');
    }

    let header, payload;
    try {
        header = JSON.parse(base64UrlDecode(parts[0]));
    } catch {
        throw new Error('Invalid JWT Header: could not decode JSON.');
    }

    try {
        payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch {
        throw new Error('Invalid JWT Payload: could not decode JSON.');
    }

    return { header, payload, signature: parts[2] };
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 5;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Paste your JWT token here (eyJhbGciOi...)';
    input.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkF2ZXJ5IFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDQxNTM2MDAsImV4cCI6MjAwODIyNDAwMH0.dummySignatureString123';

    const decodeBtn = button({ label: 'Decode Token', variant: 'primary' });
    const clearBtn = button({ label: 'Clear' });
    const feedback = status();

    const expBanner = node('<div class="rounded-xl border p-3 text-xs font-semibold" hidden></div>');
    const headerOutput = document.createElement('pre');
    headerOutput.className = 'bg-slate-900 text-amber-300 p-3 rounded-xl overflow-x-auto text-xs font-mono';
    const payloadOutput = document.createElement('pre');
    payloadOutput.className = 'bg-slate-900 text-cyan-300 p-3 rounded-xl overflow-x-auto text-xs font-mono';

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(decodeBtn, clearBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">JWT Token</label>'),
        input,
        actions,
        feedback.el,
        expBanner,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Header: Algorithm & Token Type</h3>'),
        headerOutput,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Payload: Data & Registered Claims</h3>'),
        payloadOutput
    );

    root.append(panel({ title: 'JSON Web Token (JWT) Decoder', body }));

    function run() {
        const raw = input.value.trim();
        if (!raw) {
            feedback.set('Please enter a JWT token.', 'warning');
            return;
        }

        try {
            const { header, payload } = parseJwt(raw);
            headerOutput.textContent = JSON.stringify(header, null, 2);
            payloadOutput.textContent = JSON.stringify(payload, null, 2);

            expBanner.hidden = false;
            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                const isExpired = Date.now() > expDate.getTime();
                if (isExpired) {
                    expBanner.className = 'rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-3 text-xs font-semibold';
                    expBanner.textContent = `Token Expired on: ${expDate.toUTCString()}`;
                } else {
                    expBanner.className = 'rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-3 text-xs font-semibold';
                    expBanner.textContent = `Token Active (Expires on: ${expDate.toUTCString()})`;
                }
            } else {
                expBanner.className = 'rounded-xl border border-slate-200 bg-slate-50 text-slate-700 p-3 text-xs font-semibold';
                expBanner.textContent = 'Token does not contain an "exp" (expiration) claim.';
            }

            feedback.set('JWT decoded successfully.', 'success');
            announce('JWT decoded.');
            void complete();
        } catch (err) {
            expBanner.hidden = true;
            headerOutput.textContent = '';
            payloadOutput.textContent = '';
            feedback.set(err.message, 'error');
        }
    }

    input.addEventListener('input', run);
    decodeBtn.addEventListener('click', run);
    clearBtn.addEventListener('click', () => {
        input.value = '';
        expBanner.hidden = true;
        headerOutput.textContent = '';
        payloadOutput.textContent = '';
        feedback.set('');
    });

    run();
}

