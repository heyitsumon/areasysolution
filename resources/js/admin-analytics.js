import Chart from 'chart.js/auto';

const numberFormat = new Intl.NumberFormat();
const refreshInterval = 30_000;

function makeLineChart(canvas, data) {
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(79, 95, 230, 0.2)');
    gradient.addColorStop(1, 'rgba(79, 95, 230, 0)');

    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.dailyVisits.map((point) => point.label),
            datasets: [
                {
                    label: 'Page views',
                    data: data.dailyVisits.map((point) => point.value),
                    borderColor: '#5364df',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.36,
                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2,
                },
                {
                    label: 'Tool sessions',
                    data: data.dailyRuns.map((point) => point.value),
                    borderColor: '#0e9f6e',
                    backgroundColor: 'rgba(14, 159, 110, 0.08)',
                    fill: false,
                    tension: 0.36,
                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            animation: { duration: 350 },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 20 },
                },
                tooltip: {
                    backgroundColor: '#17213b',
                    padding: 12,
                    cornerRadius: 10,
                    displayColors: true,
                    callbacks: { label: (item) => `${item.dataset.label}: ${numberFormat.format(item.parsed.y)}` },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: '#7b8498', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
                },
                y: {
                    beginAtZero: true,
                    border: { display: false, dash: [4, 4] },
                    grid: { color: '#edf0f5' },
                    ticks: { color: '#7b8498', precision: 0, callback: (value) => numberFormat.format(value) },
                },
            },
        },
    });
}

function makeBarChart(canvas, entries, color) {
    return new Chart(canvas, {
        type: 'bar',
        data: {
            labels: entries.map((entry) => entry.label),
            datasets: [{
                data: entries.map((entry) => entry.value),
                backgroundColor: color,
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 15,
                maxBarThickness: 18,
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 350 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#17213b',
                    padding: 11,
                    cornerRadius: 9,
                    callbacks: { label: (item) => numberFormat.format(item.parsed.x) },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: '#edf0f5' },
                    ticks: { color: '#7b8498', precision: 0, callback: (value) => numberFormat.format(value) },
                },
                y: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: '#59647b', autoSkip: false },
                },
            },
        },
    });
}

function setStatus(element, message, state = 'ready') {
    element.textContent = message;
    element.dataset.state = state;
}

function updateCharts(charts, data) {
    const trend = charts.activity;
    trend.data.labels = data.dailyVisits.map((point) => point.label);
    trend.data.datasets[0].data = data.dailyVisits.map((point) => point.value);
    trend.data.datasets[1].data = data.dailyRuns.map((point) => point.value);
    trend.update();

    for (const [key, entries] of [['routes', data.topRoutes], ['tools', data.topTools]]) {
        const chart = charts[key];
        const canvas = chart.canvas;
        const emptyMessage = document.querySelector(`[data-empty="${key}"]`);
        const hasData = entries.length > 0;

        canvas.hidden = !hasData;
        emptyMessage.hidden = hasData;
        chart.data.labels = entries.map((entry) => entry.label);
        chart.data.datasets[0].data = entries.map((entry) => entry.value);
        chart.update();
    }
}

function updateMetrics(data) {
    const metrics = {
        'pageViews.today': data.pageViews.today,
        'pageViews.week': data.pageViews.week,
        'pageViews.month': data.pageViews.month,
        newUsers: data.newUsers,
        activeUsers: data.activeUsers,
        completedRuns: data.completedRuns,
        completedUsers: data.completedUsers,
        totalUsers: data.totalUsers,
    };

    for (const [key, value] of Object.entries(metrics)) {
        const element = document.querySelector(`[data-metric="${key}"]`);
        if (element) element.textContent = numberFormat.format(value);
    }
}

function updateRecentUsers(users) {
    const tableBody = document.querySelector('[data-recent-users]');
    if (!tableBody) return;

    const rows = users.map((user) => {
        const row = document.createElement('tr');
        const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }) : '—';

        for (const value of [user.name, user.email, joined]) {
            const cell = document.createElement('td');
            cell.textContent = value ?? '';
            row.append(cell);
        }

        return row;
    });

    if (rows.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.className = 'muted';
        cell.textContent = 'No registered users yet.';
        row.append(cell);
        rows.push(row);
    }

    tableBody.replaceChildren(...rows);
}

export function bootAdminAnalytics() {
    const dashboard = document.querySelector('[data-admin-analytics]');
    if (!dashboard) return;

    const status = dashboard.querySelector('[data-refresh-status]');
    const refreshButton = dashboard.querySelector('[data-refresh-now]');
    const activityCanvas = dashboard.querySelector('[data-chart="activity"]');
    const routesCanvas = dashboard.querySelector('[data-chart="routes"]');
    const toolsCanvas = dashboard.querySelector('[data-chart="tools"]');
    const charts = {
        activity: makeLineChart(activityCanvas, { dailyVisits: [], dailyRuns: [] }),
        routes: makeBarChart(routesCanvas, [], '#6878ed'),
        tools: makeBarChart(toolsCanvas, [], '#35b88a'),
    };
    let refreshing = false;

    async function refresh() {
        if (refreshing || document.visibilityState === 'hidden') return;
        refreshing = true;
        refreshButton.disabled = true;
        setStatus(status, 'Updating analytics…', 'loading');

        try {
            const response = await fetch(dashboard.dataset.endpoint, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`Analytics refresh failed with HTTP ${response.status}.`);
            }

            const data = await response.json();
            updateMetrics(data);
            updateCharts(charts, data);
            updateRecentUsers(data.recentUsers);
            setStatus(status, `Updated ${new Date(data.updatedAt).toLocaleTimeString()}`, 'ready');
        } catch (error) {
            console.error('Admin analytics refresh failed.', error);
            setStatus(status, 'Could not refresh. Check your connection and try again.', 'error');
        } finally {
            refreshing = false;
            refreshButton.disabled = false;
        }
    }

    refreshButton.addEventListener('click', refresh);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refresh();
    });
    window.setInterval(refresh, refreshInterval);
    refresh();
}
