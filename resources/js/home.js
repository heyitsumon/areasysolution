export function bootHomeToolFinder() {
    const searchInput = document.querySelector('[data-tool-search-input]');
    const filterButtons = [...document.querySelectorAll('[data-tool-filter]')];
    const toolCards = [...document.querySelectorAll('[data-tool-grid] .home-tool-card')];
    const resultCount = document.querySelector('[data-tool-result-count]');
    const emptyState = document.querySelector('[data-tool-empty]');
    const quickChips = [...document.querySelectorAll('[data-quick-search]')];

    if (!searchInput || !resultCount || !emptyState || toolCards.length === 0) return;

    let activeCategory = 'all';

    const updateTools = () => {
        const query = searchInput.value.trim().toLocaleLowerCase();
        let visibleCount = 0;

        toolCards.forEach((card) => {
            const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
            const matchesSearch = !query || (card.dataset.search || '').includes(query);
            const visible = matchesCategory && matchesSearch;

            card.hidden = !visible;
            visibleCount += Number(visible);
        });

        resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'tool' : 'tools'}`;
        emptyState.hidden = visibleCount > 0;
    };

    searchInput.addEventListener('input', updateTools);

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeCategory = button.dataset.toolFilter || 'all';
            filterButtons.forEach((filter) => {
                filter.setAttribute('aria-pressed', String(filter === button));
            });
            updateTools();
        });
    });

    quickChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            searchInput.value = chip.dataset.quickSearch || '';
            filterButtons.forEach((filter) => {
                filter.setAttribute('aria-pressed', String(filter.dataset.toolFilter === 'all'));
            });
            activeCategory = 'all';
            updateTools();
            searchInput.focus();
            document.getElementById('tool-finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}
