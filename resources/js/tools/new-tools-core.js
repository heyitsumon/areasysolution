export function calculateDiscount(price, discountPercent, extraDiscountPercent = 0, taxPercent = 0) {
    if (price < 0 || discountPercent < 0 || extraDiscountPercent < 0 || taxPercent < 0) {
        throw new Error('Values cannot be negative.');
    }
    const firstDiscountAmount = price * (discountPercent / 100);
    const priceAfterFirst = price - firstDiscountAmount;
    const secondDiscountAmount = priceAfterFirst * (extraDiscountPercent / 100);
    const discountedPrice = priceAfterFirst - secondDiscountAmount;
    const totalSavings = firstDiscountAmount + secondDiscountAmount;
    const effectiveDiscountPercent = price > 0 ? (totalSavings / price) * 100 : 0;
    const taxAmount = discountedPrice * (taxPercent / 100);
    const finalPriceWithTax = discountedPrice + taxAmount;

    return {
        originalPrice: price,
        discountedPrice,
        totalSavings,
        effectiveDiscountPercent,
        taxAmount,
        finalPriceWithTax,
    };
}

export function calculateCompoundInterest(principal, annualRate, years, frequency = 12) {
    if (principal < 0 || annualRate < 0 || years <= 0 || frequency <= 0) {
        throw new Error('Please enter positive numbers for principal, rate, and years.');
    }
    const r = annualRate / 100;
    const n = frequency;
    const t = years;

    const futureValue = principal * Math.pow(1 + r / n, n * t);
    const totalInterest = futureValue - principal;

    const schedule = [];
    for (let yr = 1; yr <= t; yr++) {
        const balance = principal * Math.pow(1 + r / n, n * yr);
        const interestEarned = balance - principal;
        schedule.push({ year: yr, balance, interest: interestEarned });
    }

    return {
        principal,
        futureValue,
        totalInterest,
        schedule,
    };
}

export function calculateSalesTax(amount, taxRate, mode = 'add') {
    if (amount < 0 || taxRate < 0) {
        throw new Error('Amount and tax rate cannot be negative.');
    }
    const rate = taxRate / 100;
    let netAmount = 0;
    let taxAmount = 0;
    let grossAmount = 0;

    if (mode === 'add') {
        netAmount = amount;
        taxAmount = amount * rate;
        grossAmount = netAmount + taxAmount;
    } else {
        grossAmount = amount;
        netAmount = grossAmount / (1 + rate);
        taxAmount = grossAmount - netAmount;
    }

    return { netAmount, taxAmount, grossAmount, taxRate, mode };
}

const GRADE_POINTS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

export function calculateGpa(courses) {
    let totalPoints = 0;
    let totalCredits = 0;

    for (const c of courses) {
        const credits = Number(c.credits) || 0;
        const grade = c.grade;
        const points = GRADE_POINTS[grade] ?? 0;

        if (credits > 0) {
            totalPoints += points * credits;
            totalCredits += credits;
        }
    }

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return { gpa, totalCredits, totalPoints };
}

export function calculateCalories(age, gender, weightKg, heightCm, activityMultiplier) {
    if (age <= 0 || weightKg <= 0 || heightCm <= 0) {
        throw new Error('Please enter valid positive numbers for age, weight, and height.');
    }

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

export function calculateDateDifference(date1Str, date2Str, includeEndDay = false) {
    const d1 = new Date(date1Str + 'T00:00:00');
    const d2 = new Date(date2Str + 'T00:00:00');

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        throw new Error('Please select valid calendar dates.');
    }

    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;

    const msPerDay = 1000 * 60 * 60 * 24;
    let totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay);
    if (includeEndDay) totalDays += 1;

    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    let businessDays = 0;
    const cur = new Date(start);
    while (cur < end || (includeEndDay && cur.getTime() === end.getTime())) {
        const dayOfWeek = cur.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            businessDays++;
        }
        cur.setDate(cur.getDate() + 1);
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { totalDays, weeks, remainingDays, businessDays, years, months, days };
}

export function minifyCss(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([\{\}:;,>+~])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
}

export function minifyJs(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/(?![^"']*["']).*$/gm, '')
        .replace(/^\s+/gm, '')
        .replace(/\s+$/gm, '')
        .replace(/\s*([=+\-*/%&|^!<>?:;,{}()[\]])\s*/g, '$1')
        .replace(/;+/g, ';')
        .replace(/\n+/g, '\n')
        .trim();
}

const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
    'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE',
    'ALTER TABLE', 'UNION', 'UNION ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'AS', 'ON', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL', 'LIKE', 'BETWEEN', 'EXISTS',
];

export function formatSql(sql, uppercase = true) {
    if (!sql.trim()) return '';

    let formatted = sql.replace(/\s+/g, ' ').trim();

    const majorClauses = [
        'SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN',
        'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION',
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    ];

    majorClauses.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, (match) => `\n${uppercase ? match.toUpperCase() : match.toLowerCase()}`);
    });

    const subClauses = ['AND', 'OR', 'ON'];
    subClauses.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, (match) => `\n  ${uppercase ? match.toUpperCase() : match.toLowerCase()}`);
    });

    if (uppercase) {
        SQL_KEYWORDS.forEach((kw) => {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            formatted = formatted.replace(regex, (m) => m.toUpperCase());
        });
    }

    return formatted.trim();
}

export function encodeHtmlEntities(str) {
    return str.replace(/[\u00A0-\u9999<>&"'`]/gim, (i) => `&#${i.charCodeAt(0)};`);
}

export function parseJwt(token) {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format: A valid token must have 3 dot-separated parts.');
    }

    function base64UrlDecode(str) {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return Buffer.from(base64, 'base64').toString('utf-8');
    }

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    return { header, payload, signature: parts[2] };
}

export function calculateInvoiceTotals(items, taxRate = 0, discount = 0) {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
    const discountAmount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * ((Number(taxRate) || 0) / 100);
    const total = taxableAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
}

