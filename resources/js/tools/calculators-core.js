function addMonths(date, amount) {
    const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth() + amount;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

export function ageOn(birthDate, asOfDate) {
    const birth = new Date(`${birthDate}T00:00:00Z`);
    const asOf = new Date(`${asOfDate}T00:00:00Z`);

    if (!birthDate || !asOfDate || Number.isNaN(birth.getTime()) || Number.isNaN(asOf.getTime())
        || birth.toISOString().slice(0, 10) !== birthDate || asOf.toISOString().slice(0, 10) !== asOfDate) {
        throw new Error('Enter valid birth and comparison dates.');
    }
    if (birth > asOf) throw new Error('Birth date must be on or before the comparison date.');

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

export function birthdayDetailsOn(birthDate, asOfDate) {
    const age = ageOn(birthDate, asOfDate);
    const birth = new Date(`${birthDate}T00:00:00Z`);
    const asOf = new Date(`${asOfDate}T00:00:00Z`);
    const lastBirthday = addMonths(birth, age.years * 12);
    const nextBirthday = addMonths(birth, (age.years + 1) * 12);
    const daysSinceLastBirthday = (asOf.getTime() - lastBirthday.getTime()) / 86_400_000;
    const daysUntilNextBirthday = (nextBirthday.getTime() - asOf.getTime()) / 86_400_000;

    return {
        daysUntilNextBirthday,
        nextBirthday: nextBirthday.toISOString().slice(0, 10),
        ageLastBirthday: age.years,
        ageNextBirthday: age.years + 1,
        ageNearestBirthday: daysSinceLastBirthday <= daysUntilNextBirthday ? age.years : age.years + 1,
    };
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
