import { checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel } from '../lib/ui';

// Fast pure JS MD5 implementation
function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
        const lX8 = lX & 0x80000000;
        const lY8 = lY & 0x80000000;
        const lX4 = lX & 0x40000000;
        const lY4 = lY & 0x40000000;
        const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
        if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
            return lResult ^ 0x40000000 ^ lX8 ^ lY8;
        }
        return lResult ^ lX8 ^ lY8;
    }
    function F(x, y, z) { return (x & y) | (~x & z); }
    function G(x, y, z) { return (x & z) | (y & ~z); }
    function H(x, y, z) { return x ^ y ^ z; }
    function I(x, y, z) { return y ^ (x | ~z); }
    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function wordToHex(lValue) {
        let wordToHexValue = '', wordToHexValueTemp = '', lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValueTemp = '0' + lByte.toString(16);
            wordToHexValue += wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
        }
        return wordToHexValue;
    }

    const utf8 = new TextEncoder().encode(string);
    const nwords = ((utf8.length + 8) >> 6) + 1;
    const x = new Array(nwords * 16).fill(0);
    for (let i = 0; i < utf8.length; i++) {
        x[i >> 2] |= utf8[i] << ((i % 4) * 8);
    }
    x[utf8.length >> 2] |= 0x80 << ((utf8.length % 4) * 8);
    x[nwords * 16 - 2] = utf8.length * 8;

    let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
    for (let k = 0; k < x.length; k += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478); d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
        c = FF(c, d, a, b, x[k + 2], 17, 0x242070db); b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
        a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf); d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
        c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613); b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
        a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8); d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
        c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1); b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
        a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122); d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
        c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e); b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

        a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562); d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
        c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51); b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
        a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d); d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
        c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681); b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
        a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6); d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
        c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87); b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
        a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905); d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
        c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9); b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

        a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942); d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
        c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122); b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
        a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44); d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
        c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60); b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
        a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6); d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
        c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085); b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05);
        a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039); d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
        c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8); b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

        a = II(a, b, c, d, x[k + 0], 6, 0xf4292244); d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
        c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7); b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
        a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3); d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
        c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d); b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
        a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f); d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
        c = II(c, d, a, b, x[k + 6], 15, 0xa3014314); b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
        a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82); d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
        c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb); b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

        a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

async function computeWebCryptoHash(algorithm, text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 5;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Enter plain text or string to hash...';
    input.value = 'Hello, World!';

    const uppercase = checkbox({
        label: 'Uppercase hex format (ABCDEF)',
        checked: false,
    });

    const feedback = status();
    const hashesList = node('<div class="space-y-3 mt-4"></div>');

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Text String</label>'),
        input,
        uppercase.el,
        feedback.el,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Cryptographic Checksums (Click to Copy)</h3>'),
        hashesList
    );

    root.append(panel({ title: 'Cryptographic Hash Generator', body }));

    const algorithms = [
        { name: 'SHA-256', standard: 'SHA-256', bits: 256 },
        { name: 'SHA-512', standard: 'SHA-512', bits: 512 },
        { name: 'SHA-384', standard: 'SHA-384', bits: 384 },
        { name: 'SHA-1', standard: 'SHA-1', bits: 160 },
        { name: 'MD5', standard: 'MD5', bits: 128 },
    ];

    async function update() {
        const text = input.value;
        const isUpper = uppercase.input.checked;
        hashesList.replaceChildren();

        for (const algo of algorithms) {
            let hash = '';
            if (algo.standard === 'MD5') {
                hash = md5(text);
            } else {
                hash = await computeWebCryptoHash(algo.standard, text);
            }

            if (isUpper) {
                hash = hash.toUpperCase();
            }

            const row = node(`
                <div class="rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-400 transition">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-bold uppercase text-indigo-700">${algo.name} (${algo.bits} bits)</span>
                        <button type="button" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition" data-copy-btn>Copy</button>
                    </div>
                    <div class="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded border border-slate-100 select-all">${hash}</div>
                </div>
            `);

            row.querySelector('[data-copy-btn]').addEventListener('click', () => {
                copyToClipboard(hash);
                feedback.set(`Copied ${algo.name} hash to clipboard!`, 'success');
                announce(`Copied ${algo.name}.`);
                void complete();
            });

            hashesList.append(row);
        }

        void complete();
    }

    input.addEventListener('input', update);
    uppercase.input.addEventListener('change', update);

    update();
}

