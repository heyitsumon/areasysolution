import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

export function calculateCalories(age, gender, weightKg, heightCm, activityMultiplier) {
    if (age <= 0 || weightKg <= 0 || heightCm <= 0) {
        throw new Error('Please enter valid positive numbers for age, weight, and height.');
    }

    // Mifflin-St Jeor formula
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr += gender === 'male' ? 5 : -161;

    const maintenance = Math.round(bmr * activityMultiplier);
    const mildLoss = Math.round(maintenance - 250);
    const weightLoss = Math.round(maintenance - 500);
    const extremeLoss = Math.round(maintenance - 1000);
    const mildGain = Math.round(maintenance + 250);
    const weightGain = Math.round(maintenance + 500);

    return {
        bmr: Math.round(bmr),
        maintenance,
        mildLoss,
        weightLoss,
        extremeLoss,
        mildGain,
        weightGain,
    };
}

export default function mount({ root, announce, complete }) {
    const ageInput = number({ label: 'Age (Years)', value: 28, min: 14, max: 100 });
    const genderSelect = select({
        label: 'Gender',
        value: 'male',
        options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
        ],
    });
    const heightInput = number({ label: 'Height (cm)', value: 175, min: 90, max: 250 });
    const weightInput = number({ label: 'Weight (kg)', value: 72, min: 30, max: 300, step: '0.5' });
    const activitySelect = select({
        label: 'Daily Activity Level',
        value: '1.375',
        options: [
            { value: '1.2', label: 'Sedentary (Little or no exercise, desk job)' },
            { value: '1.375', label: 'Light (Exercise 1–3 times/week)' },
            { value: '1.55', label: 'Moderate (Exercise 3–5 times/week)' },
            { value: '1.725', label: 'Very Active (Hard exercise 6–7 times/week)' },
            { value: '1.9', label: 'Extra Active (Physical labor or intense training)' },
        ],
    });

    const calcBtn = button({ label: 'Calculate Daily Calories', variant: 'primary' });
    const feedback = status();
    const resultsContainer = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(ageInput.el, genderSelect.el, heightInput.el, weightInput.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, activitySelect.el, calcBtn, feedback.el, resultsContainer);

    root.append(panel({ title: 'Daily Calorie & BMR Calculator', body }));

    function run() {
        const age = Number(ageInput.input.value);
        const gender = genderSelect.select.value;
        const height = Number(heightInput.input.value);
        const weight = Number(weightInput.input.value);
        const activity = Number(activitySelect.select.value);

        try {
            const res = calculateCalories(age, gender, weight, height, activity);

            resultsContainer.innerHTML = `
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Maintain Weight</p>
                    <p class="text-3xl font-extrabold text-indigo-950 mt-1">${res.maintenance.toLocaleString()} <span class="text-xs font-normal text-slate-500">kcal/day</span></p>
                    <p class="text-[11px] text-indigo-600 mt-1">100% daily maintenance</p>
                </div>
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Weight Loss (-0.5 kg/wk)</p>
                    <p class="text-3xl font-extrabold text-emerald-950 mt-1">${res.weightLoss.toLocaleString()} <span class="text-xs font-normal text-slate-500">kcal/day</span></p>
                    <p class="text-[11px] text-emerald-700 mt-1">Healthy sustainable deficit</p>
                </div>
                <div class="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-amber-700 uppercase">Weight Gain (+0.5 kg/wk)</p>
                    <p class="text-3xl font-extrabold text-amber-950 mt-1">${res.weightGain.toLocaleString()} <span class="text-xs font-normal text-slate-500">kcal/day</span></p>
                    <p class="text-[11px] text-amber-700 mt-1">Muscle building surplus</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:col-span-3">
                    <span class="text-xs text-slate-600">Your Basal Metabolic Rate (BMR): <strong>${res.bmr.toLocaleString()} calories/day</strong> (calories burned at complete resting state).</span>
                </div>
            `;

            feedback.set('');
            announce(`Maintenance calories: ${res.maintenance} kcal.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [ageInput.input, genderSelect.select, heightInput.input, weightInput.input, activitySelect.select].forEach((el) => {
        el.addEventListener('input', run);
    });
    calcBtn.addEventListener('click', run);

    run();
}

