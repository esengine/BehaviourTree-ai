import { Behavior } from '../Behavior';
import { TaskStatus } from '../TaskStatus';

/**
 * 简单的任务，它将输出指定的文本并返回成功。 它可以用于调试。
 */
export class LogAction<T> extends Behavior<T> {
    /** 文本 */
    public text: string;
    /** 是否输出error还是log */
    public isError: boolean = false;

    constructor(text: string) {
        super();

        this.text = text;
    }

    public update(_context: T): TaskStatus {
        if (this.isError)
            console.error(this.text);
        else
            console.log(this.text);

        return TaskStatus.Success;
    }
}
