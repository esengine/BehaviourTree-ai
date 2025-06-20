import { Decorator } from './Decorator';
import { TaskStatus } from '../TaskStatus';

/**
 * 反转结果的子节点
 */
export class Inverter<T> extends Decorator<T> {
    public update(context: T): TaskStatus {
        if (!this.child) {
            throw new Error("child必须不能为空");
        }

        let status = this.child.tick(context);

        if (status == TaskStatus.Success)
            return TaskStatus.Failure;
        
        if (status == TaskStatus.Failure)
            return TaskStatus.Success;

        return TaskStatus.Running;
    }
}
