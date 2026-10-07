import { copyToClipboard } from './lib/files.js';

export function bootHomeToolFinder() {
    const searchInput = document.querySelector('[data-tool-search-input]');
    const filterButtons = [...document.querySelectorAll('[data-tool-filter]')];
    const toolCards = [...document.querySelectorAll('[data-tool-grid] .home-tool-card')];
    const resultCount = document.querySelector('[data-tool-result-count]');
    const emptyState = document.querySelector('[data-tool-empty]');

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
}

export async function bootHomeHashtagGenerator() {
    const widget = document.querySelector('[data-home-hashtag]');

    if (!widget) return;

    const form = widget.querySelector('[data-home-hashtag-form]');
    const topicInput = widget.querySelector('[name="topic"]');
    const results = widget.querySelector('[data-home-hashtag-results]');
    const copyButton = widget.querySelector('[data-home-hashtag-copy]');
    const status = widget.querySelector('[data-home-hashtag-status]');

    if (!form || !topicInput || !results || !copyButton || !status) return;

    const { generateHashtags } = await import('./tools/viral-hashtags.js');
    let currentHashtags = '';

    const updateHashtags = () => {
        const topic = topicInput.value.trim();

        if (!topic) {
            status.textContent = 'Enter a topic to generate relevant hashtag ideas.';
            topicInput.focus();
            return;
        }

        const suggestions = generateHashtags(topic, '', 'instagram');
        currentHashtags = suggestions.all.join(' ');
        results.replaceChildren(...suggestions.all.map((tag) => {
            const chip = document.createElement('span');
            chip.className = 'home-hashtag-tag';
            chip.textContent = tag;

            return chip;
        }));
        copyButton.disabled = suggestions.all.length === 0;
        status.textContent = suggestions.all.length > 0
            ? `${suggestions.all.length} hashtag ideas generated locally.`
            : 'No hashtag ideas found. Try a topic with letters or numbers.';
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        updateHashtags();
    });

    copyButton.addEventListener('click', async () => {
        if (!currentHashtags) return;

        const copied = await copyToClipboard(currentHashtags);
        status.textContent = copied
            ? 'Hashtags copied to your clipboard.'
            : 'Could not copy automatically. Select the hashtags and copy them manually.';
    });

    updateHashtags();
}
