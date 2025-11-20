import { Behavior } from '../Behavior';

export abstract class Decorator<T> extends Behavior<T> {
    public child!: Behavior<T>;

    public override invalidate(): void {
        super.invalidate();
        this.child?.invalidate();
    }

    /**
     * 释放节点及其子节点的资源
     *
     * 重写父类方法，释放子节点
     */
    public override dispose(): void {
        this.child?.dispose();
        this.child = null!;
        super.dispose();
    }
}
