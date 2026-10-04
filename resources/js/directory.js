import { debounce } from './lib/dom';

/**
 * Client-side tool directory filter.
 *
 * Everything it needs is already in the DOM (a `data-search` attribute per
 * tool), so filtering is a string comparison per card: no request, no re-render,
 * no server work. The URL is kept in sync so a filtered view can be shared.
 */
export function bootDirectoryFilter() {
    const root = document.querySelector('[data-directory]');

    if (! root) {
        return;
    }

    const input = root.querySelector('[data-directory-input]');
    const countLabel = document.querySelector('[data-directory-count]');
    const emptyState = document.querySelector('[data-directory-empty]');
    const resetButton = document.querySelector('[data-directory-reset]');
    const categoryButtons = Array.from(document.querySelectorAll('[data-directory-category]'));
    const groups = Array.from(document.querySelectorAll('[data-directory-group]'));
    const items = Array.from(document.querySelectorAll('[data-tool-item]'));
    const total = items.length;

    let category = null;

    /** @type {Map<HTMLElement, string>} */
    const haystacks = new Map(
        items.map((item) => [item, (item.dataset.search ?? '').toLowerCase()])
    );

    const apply = () => {
        const query = (input?.value ?? '').trim().toLowerCase();
        let visible = 0;

        items.forEach((item) => {
            const matchesQuery = query === '' || haystacks.get(item).includes(query);
            const matchesCategory = category === null || item.closest('[data-directory-group]')?.dataset.directoryGroup === category;
            const show = matchesQuery && matchesCategory;

            item.classList.toggle('hidden', ! show);

            if (show) {
                visible += 1;
            }
        });

        // A category heading with no visible children is noise.
        groups.forEach((group) => {
            const hasVisible = group.querySelectorAll('[data-tool-item]:not(.hidden)').length > 0;
            group.classList.toggle('hidden', ! hasVisible);
        });

        if (countLabel) {
            countLabel.textContent = visible === total
                ? `${total} tools`
                : `${visible} of ${total} tools`;
        }

        emptyState?.classList.toggle('hidden', visible > 0);

        const url = new URL(window.location.href);

        if (query === '' && category === null) {
            url.searchParams.delete('q');
        } else if (query !== '') {
            url.searchParams.set('q', query);
        }

        window.history.replaceState({}, '', url);
    };

    const debouncedApply = debounce(apply, 120);

    input?.addEventListener('input', debouncedApply);

    resetButton?.addEventListener('click', () => {
        if (input) {
            input.value = '';
        }

        category = null;
        categoryButtons.forEach((button) => button.classList.remove('bg-slate-900', 'text-white'));
        apply();
    });

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const slug = button.dataset.directoryCategory;

            category = category === slug ? null : slug;

            categoryButtons.forEach((other) => {
                const active = other === button && category !== null;
                other.classList.toggle('bg-slate-900', active);
                other.classList.toggle('text-white', active);
            });

            apply();
        });
    });

    // Honour ?q= from a shared link so the filter state survives a paste.
    const initial = new URL(window.location.href).searchParams.get('q');

    if (initial) {
        input.value = initial;
    }

    apply();
}
