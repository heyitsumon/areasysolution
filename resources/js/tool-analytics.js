export async function recordToolCompletion(toolSlug) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    if (!csrfToken) {
        throw new Error('Cannot record tool completion: this page has no CSRF token.');
    }

    const response = await fetch('/analytics/tool-completions', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ tool: toolSlug }),
    });

    if (!response.ok) {
        throw new Error(`Cannot record tool completion: server returned ${response.status}.`);
    }

    return response.json();
}
