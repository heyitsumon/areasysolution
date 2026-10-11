import { mountCalculator } from '../calculators/controller';
import { calculateLoan } from './model';
import { view } from './view';

export default function mount(context) {
    mountCalculator(context, view, calculateLoan);
}
