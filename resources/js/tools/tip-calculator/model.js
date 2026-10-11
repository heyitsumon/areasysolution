export function calculateTip([billValue, tipPercentValue, peopleValue]) {
    const bill = Number(billValue);
    const tipPercent = Number(tipPercentValue);
    const people = Number(peopleValue);

    if (!(bill >= 0) || !(tipPercent >= 0) || !(people >= 1) || !Number.isInteger(people)) {
        throw new Error('Enter a non-negative bill and tip, and at least one whole person.');
    }

    const tipAmount = bill * tipPercent / 100;

    return { tipAmount, total: bill + tipAmount, perPerson: (bill + tipAmount) / people };
}
