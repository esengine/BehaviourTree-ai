import { IAction } from './IAction';

/**
 * 日志动作
 * 
 * @description
 * 简单的动作，用于输出日志信息。
 * 适用于调试和状态跟踪。
 * 
 * @template T 上下文类型
 */
export class LogAction<T> implements IAction<T> {
    private _text: string;

    public constructor(text: string) {
        this._text = text;
    }

    public execute(_context: T): void {
        console.log(this._text);
    }
}

