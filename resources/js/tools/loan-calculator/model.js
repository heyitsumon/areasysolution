export function calculateLoan([principalValue, rateValue, yearsValue]) {
    const principal = Number(principalValue);
    const annualRatePercent = Number(rateValue);
    const years = Number(yearsValue);

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
