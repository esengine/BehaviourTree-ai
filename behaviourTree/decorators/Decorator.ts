import { Behavior } from '../Behavior';

export abstract class Decorator<T> extends Behavior<T> {
    public child!: Behavior<T>;

    public override invalidate(): void {
        super.invalidate();
        this.child?.invalidate();
    }
}
