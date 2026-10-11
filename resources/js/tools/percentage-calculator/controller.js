import { mountCalculator } from '../calculators/controller';
import { calculatePercentage } from './model';
import { view } from './view';

export default function mount(context) {
    mountCalculator(context, view, calculatePercentage);
}
