import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel } from '../lib/ui';

/**
 * Stopwatch with laps + countdown timer with alarm beep (Web Audio, no files
 * needed). Single rAF loop drives both displays.
 */
function formatClock(ms) {
    const total = Math.max(0, Math.floor(ms));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const hundredths = Math.floor((total % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function beep() {
    try {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.25, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.8);
        oscillator.onended = () => void context.close();
    } catch {
        // Audio may be blocked until first user interaction; the visual state still updates.
    }
}

export default function mount({ root, complete, announce }) {
    const stopwatchDisplay = node('<div class="text-center font-mono text-5xl font-bold text-slate-900" role="timer">00:00.00</div>');
    const timerDisplay = node('<div class="text-center font-mono text-5xl font-bold text-slate-900" role="timer">00:00.00</div>');
    const laps = node('<div class="mt-3 max-h-40 overflow-y-auto font-mono text-sm text-slate-600"></div>');
    const feedback = status();

    const swStart = button({ label: 'Start', variant: 'primary' });
    const swLap = button({ label: 'Lap' });
    const swReset = button({ label: 'Reset' });
    const swButtons = node('<div class="mt-3 flex flex-wrap justify-center gap-2"></div>');
    swButtons.append(swStart, swLap, swReset);

    const minutes = number({ label: 'Minutes', value: 5, min: 0, max: 180, step: 1 });
    const seconds = number({ label: 'Seconds', value: 0, min: 0, max: 59, step: 1 });
    const timerStart = button({ label: 'Start countdown', variant: 'primary' });
    const timerStop = button({ label: 'Stop / reset' });
    const timerButtons = node('<div class="mt-3 flex flex-wrap justify-center gap-2"></div>');
    timerButtons.append(timerStart, timerStop);

    root.append(
        panel({ title: 'Stopwatch', body: node('<div></div>') }),
        panel({ title: 'Countdown timer', body: node('<div></div>') }),
    );
    const swPanel = root.children[0].querySelector('[data-panel-body]');
    swPanel.append(stopwatchDisplay, swButtons, laps);
    const timerPanel = root.children[1].querySelector('[data-panel-body]');
    timerPanel.append(minutes.el, seconds.el, timerDisplay, timerButtons, feedback.el);

    // --- stopwatch state ---
    let swRunning = false;
    let swElapsed = 0;
    let swStartedAt = 0;
    let lapBase = 0;
    swStart.addEventListener('click', () => {
        if (swRunning) {
            swElapsed += performance.now() - swStartedAt;
            swRunning = false;
            swStart.label = 'Start';
            void complete();
        } else {
            swStartedAt = performance.now();
            swRunning = true;
            swStart.label = 'Stop';
        }
    });
    swLap.addEventListener('click', () => {
        if (!swRunning) return;
        const now = swElapsed + (performance.now() - swStartedAt);
        const lap = node(`<div class="flex justify-between border-b border-slate-100 py-1"><span>Lap ${laps.children.length + 1}</span><span>${formatClock(now - lapBase)}</span></div>`);
        laps.prepend(lap);
        lapBase = now;
    });
    swReset.addEventListener('click', () => {
        swRunning = false;
        swElapsed = 0;
        lapBase = 0;
        swStart.label = 'Start';
        laps.replaceChildren();
        stopwatchDisplay.textContent = '00:00.00';
    });

    // --- countdown state ---
    let timerRemaining = 0;
    let timerEndAt = 0;
    let timerRunning = false;
    timerStart.addEventListener('click', () => {
        if (timerRunning) return;
        const ms = (Math.round(Number(minutes.input.value) || 0) * 60 + Math.round(Number(seconds.input.value) || 0)) * 1000;
        if (ms <= 0) {
            feedback.set('Set a countdown longer than zero.', 'warning');
            return;
        }
        timerRemaining = ms;
        timerEndAt = performance.now() + ms;
        timerRunning = true;
        feedback.set('Timer running\u2026', 'info');
    });
    timerStop.addEventListener('click', () => {
        timerRunning = false;
        timerRemaining = 0;
        timerDisplay.textContent = '00:00.00';
        feedback.set('Timer stopped.', 'info');
    });

    let raf = 0;
    const tick = () => {
        if (swRunning) {
            stopwatchDisplay.textContent = formatClock(swElapsed + (performance.now() - swStartedAt));
        }
        if (timerRunning) {
            const left = timerEndAt - performance.now();
            if (left <= 0) {
                timerRunning = false;
                timerDisplay.textContent = '00:00.00';
                feedback.set('\u23F0 Time is up!', 'success');
                announce('Countdown finished.');
                beep();
                void complete();
            } else {
                timerDisplay.textContent = formatClock(left);
            }
        }
        raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
}
