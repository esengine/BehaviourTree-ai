import { Decorator } from './Decorator';
import { TaskStatus } from '../TaskStatus';

/**
 *  将总是返回成功，除了当子任务正在运行时
 */
export class AlwaysSucceed<T> extends Decorator<T> {
    public update(context: T): TaskStatus {
        if (!this.child) {
            throw new Error("child必须不能为空");
        }

        let status = this.child.update(context);

        if (status == TaskStatus.Running)
            return TaskStatus.Running;

        return TaskStatus.Success;
    }
}
