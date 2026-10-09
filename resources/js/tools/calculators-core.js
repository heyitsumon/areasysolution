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

function greatestCommonDivisor(a, b) {
    let first = Math.abs(a);
    let second = Math.abs(b);

    while (second) {
        const remainder = first % second;
        first = second;
        second = remainder;
    }

    return first || 1;
}

function normalizeFraction(numerator, denominator) {
    if (denominator === 0) {
        throw new Error('The denominator cannot be zero.');
    }

    if (denominator < 0) {
        numerator *= -1;
        denominator *= -1;
    }

    if (numerator === 0) {
        return { numerator: 0, denominator: 1 };
    }

    const divisor = greatestCommonDivisor(numerator, denominator);

    return {
        numerator: numerator / divisor,
        denominator: denominator / divisor,
    };
}

function decimalToFraction(value) {
    if (!Number.isFinite(value)) {
        throw new Error('Enter a valid numeric value.');
    }

    const sign = Object.is(value, -0) ? -1 : Math.sign(value) || 1;
    const absolute = Math.abs(value);
    const whole = Math.trunc(absolute);
    const decimal = absolute - whole;
    const decimalPlaces = decimal.toString().split('.')[1]?.length ?? 0;
    const denominator = 10 ** Math.max(decimalPlaces, 1);
    const numerator = Math.round((decimal * denominator) + Number.EPSILON);

    return normalizeFraction(sign * (whole * denominator + numerator), denominator);
}

export function formatMixedNumber(numerator, denominator) {
    const { numerator: normalizedNumerator, denominator: normalizedDenominator } = normalizeFraction(numerator, denominator);
    const sign = normalizedNumerator < 0 ? '-' : '';
    const absoluteNumerator = Math.abs(normalizedNumerator);
    const whole = Math.trunc(absoluteNumerator / normalizedDenominator);
    const remainder = absoluteNumerator % normalizedDenominator;

    if (remainder === 0) {
        return `${sign}${whole || 0}`;
    }

    if (whole === 0) {
        return `${sign}${remainder}/${normalizedDenominator}`;
    }

    return `${sign}${whole} ${remainder}/${normalizedDenominator}`;
}

export function parseMixedNumber(value) {
    const text = String(value ?? '').trim();

    if (text === '') {
        throw new Error('Enter a mixed number, fraction, integer or decimal.');
    }

    const sign = /^-/.test(text) ? -1 : 1;
    const unsigned = text.replace(/^[-+]/u, '').trim();

    if (!unsigned) {
        throw new Error('Enter a mixed number, fraction, integer or decimal.');
    }

    const mixedMatch = /^(\d+)\s+(\d+)\/(\d+)$/u.exec(unsigned);
    if (mixedMatch) {
        const [, whole, numerator, denominator] = mixedMatch;
        return normalizeFraction(sign * (Number(whole) * Number(denominator) + Number(numerator)), Number(denominator));
    }

    const fractionMatch = /^(\d+)\/(\d+)$/u.exec(unsigned);
    if (fractionMatch) {
        const [, numerator, denominator] = fractionMatch;
        return normalizeFraction(sign * Number(numerator), Number(denominator));
    }

    const numericValue = Number(unsigned);
    if (Number.isFinite(numericValue)) {
        return decimalToFraction(sign * numericValue);
    }

    throw new Error('Enter a valid mixed number, fraction, integer or decimal.');
}

export function mixedNumberOperation(left, right, operation) {
    const leftFraction = parseMixedNumber(left);
    const rightFraction = parseMixedNumber(right);

    let numerator;
    let denominator;

    if (operation === 'add') {
        numerator = leftFraction.numerator * rightFraction.denominator + rightFraction.numerator * leftFraction.denominator;
        denominator = leftFraction.denominator * rightFraction.denominator;
    } else if (operation === 'subtract') {
        numerator = leftFraction.numerator * rightFraction.denominator - rightFraction.numerator * leftFraction.denominator;
        denominator = leftFraction.denominator * rightFraction.denominator;
    } else if (operation === 'multiply') {
        numerator = leftFraction.numerator * rightFraction.numerator;
        denominator = leftFraction.denominator * rightFraction.denominator;
    } else if (operation === 'divide') {
        if (rightFraction.numerator === 0) {
            throw new Error('The divisor cannot be zero.');
        }

        numerator = leftFraction.numerator * rightFraction.denominator;
        denominator = leftFraction.denominator * rightFraction.numerator;
    } else {
        throw new Error('Choose a valid operation.');
    }

    return formatMixedNumber(numerator, denominator);
}

export function gpa(courses) {
    const gradePoints = {
        'A': 4,
        'A-': 3.7,
        'B+': 3.3,
        'B': 3,
        'B-': 2.7,
        'C+': 2.3,
        'C': 2,
        'C-': 1.7,
        'D+': 1.3,
        'D': 1,
        'D-': 0.7,
        'F': 0,
    };

    const rows = Array.isArray(courses) ? courses : [];
    const validRows = rows.filter((course) => Number.isFinite(Number(course?.credits)) && Number(course?.credits) > 0 && gradePoints[course?.grade] !== undefined);

    if (validRows.length === 0) {
        return { gpa: 0, totalCredits: 0, rows: [] };
    }

    const totalCredits = validRows.reduce((sum, course) => sum + Number(course.credits), 0);
    const gradeTotal = validRows.reduce((sum, course) => sum + (gradePoints[course.grade] * Number(course.credits)), 0);

    const result = totalCredits > 0 ? gradeTotal / totalCredits : 0;
    const roundToThree = (value) => {
        const sign = Math.sign(value) || 1;
        return sign * (Math.round((Math.abs(value) * 1000) + 0.5) / 1000);
    };

    return {
        gpa: roundToThree(result),
        totalCredits,
        rows: validRows.map((course) => ({
            ...course,
            gradePoints: roundToThree(gradePoints[course.grade] * Number(course.credits)),
        })),
    };
}

export function money(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
