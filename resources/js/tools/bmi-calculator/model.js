export function calculateBmi([weightValue, heightValue]) {
    const weightKg = Number(weightValue);
    const heightCm = Number(heightValue);

    if (!(weightKg > 0) || !(heightCm > 0)) {
        throw new Error('Weight and height must be greater than zero.');
    }

    const value = weightKg / (heightCm / 100) ** 2;
    const category = value < 18.5 ? 'Underweight' : value < 25 ? 'Healthy range' : value < 30 ? 'Overweight' : 'Obesity range';

    return { value, category };
}
