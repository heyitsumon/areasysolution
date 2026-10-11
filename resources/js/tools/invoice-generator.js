import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { escapeHtml } from '../lib/dom';
import { node, panel } from '../lib/ui';
import { calculateInvoiceTotals } from './new-tools-core';

export default function mount({ root, announce, complete }) {
    // Initial sample data
    let invoice = {
        from: {
            name: 'Acme Studio Design Inc.',
            email: 'billing@acmestudio.com',
            address: '100 Innovation Way, Suite 300\nSan Francisco, CA 94107',
            phone: '+1 (555) 234-5678',
        },
        to: {
            name: 'Global Enterprises LLC',
            email: 'accounts@globalenterprises.com',
            address: '450 Fifth Avenue, Floor 12\nNew York, NY 10018',
        },
        meta: {
            number: 'INV-2026-0042',
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currency: '$',
        },
        items: [
            { description: 'Website Redesign & UI/UX Architecture', quantity: 1, rate: 2400 },
            { description: 'Responsive Frontend Development (Vite/Tailwind)', quantity: 40, rate: 85 },
            { description: 'SEO Performance Optimization & Schema Setup', quantity: 1, rate: 650 },
        ],
        financials: {
            taxRate: 8.5,
            discount: 150,
        },
        notes: 'Payment is due within 14 days of invoice date. Thank you for your partnership!',
    };

    // Editor fields
    const fromName = node(`<input type="text" value="${escapeHtml(invoice.from.name)}" class="field-input text-xs" placeholder="Your Business / Freelancer Name">`);
    const fromEmail = node(`<input type="email" value="${escapeHtml(invoice.from.email)}" class="field-input text-xs" placeholder="Your Email">`);
    const fromAddress = node(`<textarea rows="2" class="field-input text-xs" placeholder="Address, City, Country">${escapeHtml(invoice.from.address)}</textarea>`);
    const fromPhone = node(`<input type="text" value="${escapeHtml(invoice.from.phone)}" class="field-input text-xs" placeholder="Phone (optional)">`);

    const toName = node(`<input type="text" value="${escapeHtml(invoice.to.name)}" class="field-input text-xs" placeholder="Client / Company Name">`);
    const toEmail = node(`<input type="email" value="${escapeHtml(invoice.to.email)}" class="field-input text-xs" placeholder="Client Email">`);
    const toAddress = node(`<textarea rows="2" class="field-input text-xs" placeholder="Client Address">${escapeHtml(invoice.to.address)}</textarea>`);

    const invNumber = node(`<input type="text" value="${escapeHtml(invoice.meta.number)}" class="field-input text-xs" placeholder="Invoice #">`);
    const invDate = node(`<input type="date" value="${invoice.meta.date}" class="field-input text-xs">`);
    const invDueDate = node(`<input type="date" value="${invoice.meta.dueDate}" class="field-input text-xs">`);
    const currencySelect = node(`
        <select class="field-input text-xs font-semibold">
            <option value="$" selected>USD ($)</option>
            <option value="€">EUR (€)</option>
            <option value="£">GBP (£)</option>
            <option value="¥">JPY / CNY (¥)</option>
            <option value="₹">INR (₹)</option>
            <option value="C$">CAD (C$)</option>
            <option value="A$">AUD (A$)</option>
            <option value="CHF">CHF</option>
        </select>
    `);

    const taxInput = node(`<input type="number" min="0" max="100" step="0.1" value="${invoice.financials.taxRate}" class="field-input text-xs" placeholder="Tax %">`);
    const discountInput = node(`<input type="number" min="0" step="1" value="${invoice.financials.discount}" class="field-input text-xs" placeholder="Discount ($)">`);
    const notesInput = node(`<textarea rows="2" class="field-input text-xs" placeholder="Payment terms or thank you note">${escapeHtml(invoice.notes)}</textarea>`);

    const itemsTableBody = node('<div class="space-y-2" data-items-container></div>');
    const addItemBtn = button({ label: '+ Add Line Item' });
    const printBtn = button({ label: 'Print / Save as PDF', variant: 'primary' });
    const copySummaryBtn = button({ label: 'Copy Text Summary' });
    const feedback = status();

    // Preview Container (Invoice Sheet)
    const previewSheet = node('<div class="invoice-preview-sheet rounded-2xl border border-slate-200 bg-white p-6 shadow-sm font-sans text-slate-800"></div>');

    // Assemble Editor
    const editor = node('<div class="space-y-6"></div>');

    const metaGrid = node('<div class="grid gap-3 sm:grid-cols-4"></div>');
    metaGrid.append(
        node('<div><label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Invoice Number</label></div>').appendChild(invNumber).parentElement,
        node('<div><label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Invoice Date</label></div>').appendChild(invDate).parentElement,
        node('<div><label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Due Date</label></div>').appendChild(invDueDate).parentElement,
        node('<div><label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Currency</label></div>').appendChild(currencySelect).parentElement
    );

    const partiesGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    const fromCol = node('<div class="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3"><h4 class="text-xs font-bold uppercase text-indigo-700">From (Your Business)</h4></div>');
    fromCol.append(fromName, fromEmail, fromAddress, fromPhone);

    const toCol = node('<div class="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3"><h4 class="text-xs font-bold uppercase text-indigo-700">Bill To (Client)</h4></div>');
    toCol.append(toName, toEmail, toAddress);
    partiesGrid.append(fromCol, toCol);

    const itemsSection = node('<div class="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3"><h4 class="text-xs font-bold uppercase text-indigo-700">Invoice Items</h4></div>');
    itemsSection.append(itemsTableBody, addItemBtn);

    const totalsControls = node('<div class="grid gap-3 sm:grid-cols-2"></div>');
    totalsControls.append(
        node('<div><label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Tax Rate (%)</label></div>').appendChild(taxInput).parentElement,
        node('<div><label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Discount Amount</label></div>').appendChild(discountInput).parentElement
    );

    const actionsRow = node('<div class="flex flex-wrap gap-2 pt-2"></div>');
    actionsRow.append(printBtn, copySummaryBtn);

    editor.append(metaGrid, partiesGrid, itemsSection, totalsControls, node('<div><label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Notes & Terms</label></div>').appendChild(notesInput).parentElement, actionsRow, feedback.el);

    // Root Two-Pane Layout
    const workspace = node('<div class="grid gap-8 lg:grid-cols-12"></div>');
    const leftPane = node('<div class="lg:col-span-6 no-print space-y-4"></div>');
    leftPane.append(editor);
    const rightPane = node('<div class="lg:col-span-6"></div>');
    rightPane.append(previewSheet);
    workspace.append(leftPane, rightPane);

    root.append(panel({ title: 'Free Browser Invoice Generator', body: workspace }));

    function renderItemRows() {
        itemsTableBody.replaceChildren();
        invoice.items.forEach((item, index) => {
            const row = node(`
                <div class="flex items-center gap-2 rounded-lg bg-white border border-slate-200 p-2">
                    <input type="text" value="${escapeHtml(item.description)}" class="field-input text-xs flex-1 min-w-32" placeholder="Description" data-item-desc>
                    <input type="number" min="1" step="1" value="${item.quantity}" class="field-input text-xs w-16 text-center" placeholder="Qty" data-item-qty>
                    <input type="number" min="0" step="0.01" value="${item.rate}" class="field-input text-xs w-20 text-right" placeholder="Rate" data-item-rate>
                    <button type="button" class="text-slate-400 hover:text-rose-600 px-2 py-1 text-sm font-bold" title="Delete line item" data-del-item>×</button>
                </div>
            `);

            row.querySelector('[data-item-desc]').addEventListener('input', (e) => {
                invoice.items[index].description = e.target.value;
                updatePreview();
            });
            row.querySelector('[data-item-qty]').addEventListener('input', (e) => {
                invoice.items[index].quantity = Number(e.target.value) || 0;
                updatePreview();
            });
            row.querySelector('[data-item-rate]').addEventListener('input', (e) => {
                invoice.items[index].rate = Number(e.target.value) || 0;
                updatePreview();
            });
            row.querySelector('[data-del-item]').addEventListener('click', () => {
                if (invoice.items.length > 1) {
                    invoice.items.splice(index, 1);
                    renderItemRows();
                    updatePreview();
                }
            });

            itemsTableBody.append(row);
        });
    }

    addItemBtn.addEventListener('click', () => {
        invoice.items.push({ description: 'New Service or Item', quantity: 1, rate: 100 });
        renderItemRows();
        updatePreview();
    });

    function updatePreview() {
        const cur = currencySelect.value;
        const taxRate = Number(taxInput.value) || 0;
        const discount = Number(discountInput.value) || 0;

        const { subtotal, discountAmount, taxAmount, total } = calculateInvoiceTotals(invoice.items, taxRate, discount);

        previewSheet.innerHTML = `
            <div class="border-b border-slate-200 pb-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-black tracking-tight text-indigo-700">${escapeHtml(fromName.value || 'Your Company')}</h2>
                        <p class="text-xs text-slate-500 mt-1 whitespace-pre-line">${escapeHtml(fromAddress.value)}</p>
                        <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(fromEmail.value)} ${fromPhone.value ? '· ' + escapeHtml(fromPhone.value) : ''}</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 uppercase tracking-wider">Invoice</span>
                        <p class="text-base font-extrabold text-slate-900 mt-1.5">${escapeHtml(invNumber.value || 'INV-001')}</p>
                        <p class="text-[11px] text-slate-500 mt-1">Date: <strong>${escapeHtml(invDate.value)}</strong></p>
                        <p class="text-[11px] text-slate-500">Due: <strong>${escapeHtml(invDueDate.value)}</strong></p>
                    </div>
                </div>
            </div>

            <div class="py-5 border-b border-slate-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To</p>
                <h3 class="text-sm font-bold text-slate-900 mt-1">${escapeHtml(toName.value || 'Client Name')}</h3>
                <p class="text-xs text-slate-600 mt-0.5 whitespace-pre-line">${escapeHtml(toAddress.value)}</p>
                <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(toEmail.value)}</p>
            </div>

            <div class="py-5">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                            <th class="py-2">Item Description</th>
                            <th class="py-2 text-center w-16">Qty</th>
                            <th class="py-2 text-right w-24">Rate</th>
                            <th class="py-2 text-right w-24">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${invoice.items.map((it) => `
                            <tr>
                                <td class="py-2.5 font-medium text-slate-900">${escapeHtml(it.description || 'Item')}</td>
                                <td class="py-2.5 text-center text-slate-600">${it.quantity}</td>
                                <td class="py-2.5 text-right text-slate-600">${cur}${Number(it.rate).toFixed(2)}</td>
                                <td class="py-2.5 text-right font-bold text-slate-900">${cur}${(it.quantity * it.rate).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="border-t border-slate-200 pt-4">
                <div class="flex flex-col items-end gap-1.5 text-xs text-slate-600">
                    <div class="flex justify-between w-56">
                        <span>Subtotal:</span>
                        <span class="font-semibold text-slate-900">${cur}${subtotal.toFixed(2)}</span>
                    </div>
                    ${discountAmount > 0 ? `
                        <div class="flex justify-between w-56 text-emerald-600">
                            <span>Discount:</span>
                            <span class="font-semibold">-${cur}${discountAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    ${taxRate > 0 ? `
                        <div class="flex justify-between w-56">
                            <span>Tax (${taxRate}%):</span>
                            <span class="font-semibold text-slate-900">${cur}${taxAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between w-56 border-t border-slate-300 pt-2 text-sm font-extrabold text-slate-950 mt-1">
                        <span>Total Due:</span>
                        <span class="text-indigo-700">${cur}${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            ${notesInput.value.trim() ? `
                <div class="mt-6 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-[11px] leading-relaxed text-slate-600">
                    <span class="font-bold text-slate-700 block mb-0.5">Notes & Terms:</span>
                    ${escapeHtml(notesInput.value)}
                </div>
            ` : ''}
        `;
    }

    [fromName, fromEmail, fromAddress, fromPhone, toName, toEmail, toAddress, invNumber, invDate, invDueDate, currencySelect, taxInput, discountInput, notesInput].forEach((el) => {
        el.addEventListener('input', updatePreview);
    });

    printBtn.addEventListener('click', () => {
        announce('Opening print dialog.');
        void complete();
        window.print();
    });

    copySummaryBtn.addEventListener('click', () => {
        const cur = currencySelect.value;
        const taxRate = Number(taxInput.value) || 0;
        const discount = Number(discountInput.value) || 0;
        const { subtotal, total } = calculateInvoiceTotals(invoice.items, taxRate, discount);

        const summary = `INVOICE ${invNumber.value}\nDate: ${invDate.value} | Due: ${invDueDate.value}\nFrom: ${fromName.value}\nTo: ${toName.value}\nTotal Amount Due: ${cur}${total.toFixed(2)}\nItems: ${invoice.items.length} items`;
        copyToClipboard(summary);
        feedback.set('Copied invoice summary to clipboard!', 'success');
        announce('Copied summary.');
        void complete();
    });

    renderItemRows();
    updatePreview();
}

