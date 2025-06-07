import { Behavior } from '../Behavior.js';

export abstract class Decorator<T> extends Behavior<T> {
    public child!: Behavior<T>;

    public invalidate(): void {
        super.invalidate();
        this.child.invalidate();
    }
}
