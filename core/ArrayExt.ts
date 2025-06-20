import { Random } from './Random';

/**
 * 数组扩展器和高效数据结构工具
 * 提供栈、队列等数据结构的高效实现
 */
export class ArrayExt {
    /**
     * 将数组打乱顺序（Fisher-Yates洗牌算法）
     * 时间复杂度: O(n)，空间复杂度: O(1)
     * 
     * @param list 要打乱的数组
     * @throws {Error} 当数组为null或undefined时抛出错误
     */
    public static shuffle<T>(list: Array<T>): void {
        if (!list) {
            throw new Error('数组不能为null或undefined');
        }
        
        // 优化：从后往前遍历，减少一次减法运算
        for (let i = list.length - 1; i > 0; i--) {
            const j = Random.integer(0, i);
            // 使用解构赋值进行交换，更简洁
            [list[i], list[j]] = [list[j]!, list[i]!];
        }
    }

    /**
     * 取出数组第一个项（不移除）
     * @param list 目标数组
     * @returns 第一个元素
     * @throws {Error} 当数组为空时抛出错误
     */
    public static peek<T>(list: Array<T>): T {
        if (list.length === 0) {
            throw new Error('无法从空数组中获取元素');
        }
        return list[0]!;
    }

    /**
     * 向数组头部添加一个项
     * @param list 目标数组
     * @param item 要添加的项
     */
    public static unshift<T>(list: Array<T>, item: T): void {
        list.unshift(item);
    }

    /**
     * 移除数组第一个项并返回它
     * @param list 目标数组
     * @returns 移除的元素，如果数组为空则返回undefined
     */
    public static pop<T>(list: Array<T>): T | undefined {
        return list.shift();
    }

    /**
     * 向数组尾部添加一个项
     * @param list 目标数组
     * @param item 要添加的项
     */
    public static append<T>(list: Array<T>, item: T): void {
        list.push(item);
    }

    /**
     * 移除数组最后一个项并返回它
     * @param list 目标数组
     * @returns 移除的元素，如果数组为空则返回undefined
     */
    public static removeLast<T>(list: Array<T>): T | undefined {
        return list.pop();
    }

    /**
     * 检查数组是否为空
     * @param list 目标数组
     * @returns 是否为空
     */
    public static isEmpty<T>(list: Array<T>): boolean {
        return list.length === 0;
    }

    /**
     * 获取数组大小
     * @param list 目标数组
     * @returns 数组长度
     */
    public static size<T>(list: Array<T>): number {
        return list.length;
    }

    /**
     * 清空数组
     * @param list 目标数组
     */
    public static clear<T>(list: Array<T>): void {
        list.length = 0;
    }
}

/**
 * 高效的双端队列实现
 * 使用环形缓冲区，避免数组头部插入的性能问题
 * 
 * @template T 队列中元素的类型
 * 
 * @example
 * ```typescript
 * const deque = new Deque<number>(32);
 * deque.push(1);
 * deque.unshift(0);
 * console.log(deque.peekFirst()); // 0
 * console.log(deque.peekLast());  // 1
 * ```
 */
export class Deque<T> {
    private _buffer: (T | undefined)[];
    private _head: number = 0;
    private _tail: number = 0;
    private _size: number = 0;
    private _capacity: number;

    /**
     * 创建双端队列
     * @param initialCapacity 初始容量，必须大于0，默认16
     */
    constructor(initialCapacity: number = 16) {
        if (initialCapacity <= 0) {
            throw new Error('初始容量必须大于0');
        }
        this._capacity = Math.max(initialCapacity, 4);
        this._buffer = new Array(this._capacity);
    }

    /**
     * 向队列头部添加元素
     * @param item 要添加的元素
     */
    public unshift(item: T): void {
        if (this._size === this._capacity) {
            this._resize();
        }

        this._head = (this._head - 1 + this._capacity) % this._capacity;
        this._buffer[this._head] = item;
        this._size++;
    }

    /**
     * 向队列尾部添加元素
     * @param item 要添加的元素
     */
    public push(item: T): void {
        if (this._size === this._capacity) {
            this._resize();
        }

        this._buffer[this._tail] = item;
        this._tail = (this._tail + 1) % this._capacity;
        this._size++;
    }

    /**
     * 从队列头部移除元素
     * @returns 移除的元素，如果队列为空则返回undefined
     */
    public shift(): T | undefined {
        if (this._size === 0) {
            return undefined;
        }

        const item = this._buffer[this._head];
        this._buffer[this._head] = undefined;
        this._head = (this._head + 1) % this._capacity;
        this._size--;

        return item;
    }

    /**
     * 从队列尾部移除元素
     * @returns 移除的元素，如果队列为空则返回undefined
     */
    public pop(): T | undefined {
        if (this._size === 0) {
            return undefined;
        }

        this._tail = (this._tail - 1 + this._capacity) % this._capacity;
        const item = this._buffer[this._tail];
        this._buffer[this._tail] = undefined;
        this._size--;

        return item;
    }

    /**
     * 查看队列头部元素（不移除）
     * @returns 头部元素，如果队列为空则返回undefined
     */
    public peekFirst(): T | undefined {
        return this._size > 0 ? this._buffer[this._head] : undefined;
    }

    /**
     * 查看队列尾部元素（不移除）
     * @returns 尾部元素，如果队列为空则返回undefined
     */
    public peekLast(): T | undefined {
        if (this._size === 0) {
            return undefined;
        }
        const lastIndex = (this._tail - 1 + this._capacity) % this._capacity;
        return this._buffer[lastIndex];
    }

    /**
     * 获取队列大小
     */
    public get size(): number {
        return this._size;
    }

    /**
     * 检查队列是否为空
     */
    public get isEmpty(): boolean {
        return this._size === 0;
    }

    /**
     * 清空队列
     */
    public clear(): void {
        for (let i = 0; i < this._capacity; i++) {
            this._buffer[i] = undefined;
        }
        this._head = 0;
        this._tail = 0;
        this._size = 0;
    }

    /**
     * 扩容队列（内部使用）
     * 当队列满时自动调用，容量翻倍
     */
    private _resize(): void {
        const newCapacity = this._capacity * 2;
        const newBuffer = new Array<T | undefined>(newCapacity);
        
        // 复制现有元素到新缓冲区
        for (let i = 0; i < this._size; i++) {
            newBuffer[i] = this._buffer[(this._head + i) % this._capacity];
        }
        
        this._buffer = newBuffer;
        this._head = 0;
        this._tail = this._size;
        this._capacity = newCapacity;
    }

    /**
     * 将队列转换为数组
     * @returns 包含队列所有元素的数组（从头到尾的顺序）
     */
    public toArray(): T[] {
        const result: T[] = [];
        for (let i = 0; i < this._size; i++) {
            const item = this._buffer[(this._head + i) % this._capacity];
            if (item !== undefined) {
                result.push(item);
            }
        }
        return result;
    }
}
