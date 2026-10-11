import { mountCalculator } from '../calculators/controller';
import { calculateBmi } from './model';
import { view } from './view';

export default function mount(context) {
    mountCalculator(context, view, calculateBmi);
}
