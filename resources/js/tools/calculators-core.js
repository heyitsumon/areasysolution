export function percentage(mode, first, second) {
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
        throw new Error('Enter valid numbers in both fields.');
    }

    if (mode === 'of') return first * second / 100;
    if (mode === 'is') {
        if (second === 0) throw new Error('The second number must not be zero.');
        return first / second * 100;
    }
    if (mode === 'change') {
        if (first === 0) throw new Error('The starting value must not be zero.');
        return (second - first) / Math.abs(first) * 100;
    }

    throw new Error('Choose a valid percentage calculation.');
}

export function bmi(weightKg, heightCm) {
    if (!(weightKg > 0) || !(heightCm > 0)) throw new Error('Weight and height must be greater than zero.');
    const value = weightKg / (heightCm / 100) ** 2;
    const category = value < 18.5 ? 'Underweight' : value < 25 ? 'Healthy range' : value < 30 ? 'Overweight' : 'Obesity range';
    return { value, category };
}

export function ageOn(birthDate, asOfDate) {
    const birth = new Date(`${birthDate}T00:00:00Z`);
    const asOf = new Date(`${asOfDate}T00:00:00Z`);

    if (!birthDate || !asOfDate || Number.isNaN(birth.getTime()) || Number.isNaN(asOf.getTime())
        || birth.toISOString().slice(0, 10) !== birthDate || asOf.toISOString().slice(0, 10) !== asOfDate) {
        throw new Error('Enter valid birth and comparison dates.');
    }
    if (birth > asOf) throw new Error('Birth date must be on or before the comparison date.');

    const addMonths = (date, amount) => {
        const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth() + amount;
        const year = Math.floor(monthIndex / 12);
        const month = monthIndex % 12;
        const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

        return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
    };
    let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
    let anniversary = addMonths(birth, years * 12);

    if (anniversary > asOf) {
        years -= 1;
        anniversary = addMonths(birth, years * 12);
    }

    let months = (asOf.getUTCFullYear() - anniversary.getUTCFullYear()) * 12
        + asOf.getUTCMonth() - anniversary.getUTCMonth();
    let monthAnchor = addMonths(anniversary, months);

    if (monthAnchor > asOf) {
        months -= 1;
        monthAnchor = addMonths(anniversary, months);
    }

    const days = Math.round((asOf.getTime() - monthAnchor.getTime()) / 86_400_000);

    return { years, months, days };
}

export function ageDetailsOn(birthDate, asOfDate) {
    const age = ageOn(birthDate, asOfDate);
    const birth = new Date(`${birthDate}T00:00:00Z`);
    const asOf = new Date(`${asOfDate}T00:00:00Z`);
    const totalDays = (asOf.getTime() - birth.getTime()) / 86_400_000;

    return {
        ...age,
        totalMonths: age.years * 12 + age.months,
        totalDays,
        weeks: Math.floor(totalDays / 7),
        remainingDays: totalDays % 7,
        hours: totalDays * 24,
        minutes: totalDays * 24 * 60,
        seconds: totalDays * 24 * 60 * 60,
    };
}

export function tip(bill, tipPercent, people) {
    if (!(bill >= 0) || !(tipPercent >= 0) || !(people >= 1) || !Number.isInteger(people)) {
        throw new Error('Enter a non-negative bill and tip, and at least one whole person.');
    }
    const tipAmount = bill * tipPercent / 100;
    return { tipAmount, total: bill + tipAmount, perPerson: (bill + tipAmount) / people };
}

export function loan(principal, annualRatePercent, years) {
    if (!(principal > 0) || !(annualRatePercent >= 0) || !(years > 0)) {
        throw new Error('Loan amount and term must be positive, and the interest rate cannot be negative.');
    }

    const months = years * 12;
    const monthlyRate = annualRatePercent / 100 / 12;
    const monthlyPayment = monthlyRate === 0
        ? principal / months
        : principal * monthlyRate / (1 - (1 + monthlyRate) ** -months);

    return { monthlyPayment, totalPaid: monthlyPayment * months, totalInterest: monthlyPayment * months - principal };
}

export function money(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
