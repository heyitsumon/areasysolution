import { mountCalculator } from '../calculators/controller';
import { calculateTip } from './model';
import { view } from './view';

export default function mount(context) {
    mountCalculator(context, view, calculateTip);
}
