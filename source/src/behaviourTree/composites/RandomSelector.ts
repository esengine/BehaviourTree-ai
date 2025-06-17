import { Selector } from './Selector.js';
import { ArrayExt } from '../../core/ArrayExt.js';
import { AbortTypes } from './AbortTypes.js';

/**
 * 随机选择器节点
 * 
 * @description
 * 与Selector相同的执行逻辑，但在开始时会随机打乱子节点的执行顺序。
 * 适用于需要随机化选择优先级的场景，增加AI决策的多样性。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * // 创建一个随机选择攻击方式的选择器
 * const randomAttack = new RandomSelector<GameContext>();
 * randomAttack.addChild(new MeleeAttack());
 * randomAttack.addChild(new RangedAttack());
 * randomAttack.addChild(new SpecialAttack());
 * // 每次执行时，攻击方式的优先级都会被随机打乱
 * ```
 */
export class RandomSelector<T> extends Selector<T> {
    /** 是否在每次重新开始时都重新洗牌*/
    private _reshuffleOnRestart: boolean;
    
    /** 原始子节点顺序的备份 */
    private _originalOrder: Array<any> | null = null;

    /**
     * 创建随机选择器节点
     * @param abortType 中止类型，默认为None
     * @param reshuffleOnRestart 是否在每次重新开始时都重新洗牌，默认true
     */
    constructor(abortType: AbortTypes = AbortTypes.None, reshuffleOnRestart: boolean = true) {
        super(abortType);
        this._reshuffleOnRestart = reshuffleOnRestart;
    }

    /**
     * 节点开始时的处理
     * 随机打乱子节点顺序
     */
    public override onStart(): void {
        // 备份原始顺序（仅在第一次时）
        if (this._originalOrder === null && this._children.length > 0) {
            this._originalOrder = [...this._children];
        }

        // 只有在有多个子节点时才进行洗牌
        if (this._children.length > 1) {
            try {
                ArrayExt.shuffle(this._children);
            } catch (error) {
                console.error('RandomSelector: 洗牌子节点时发生错误:', error);
                // 如果洗牌失败，恢复原始顺序
                if (this._originalOrder) {
                    this._children = [...this._originalOrder];
                }
            }
        }
    }

    /**
     * 重置节点状态
     * 如果启用了reshuffleOnRestart，会在下次开始时重新洗牌
     */
    public override invalidate(): void {
        super.invalidate();
        
        // 如果不需要每次重启都洗牌，恢复原始顺序
        if (!this._reshuffleOnRestart && this._originalOrder) {
            this._children = [...this._originalOrder];
        }
    }

    /**
     * 设置是否在重新开始时重新洗牌
     * @param enabled 是否启用
     */
    public setReshuffleOnRestart(enabled: boolean): void {
        this._reshuffleOnRestart = enabled;
    }

    /**
     * 获取是否在重新开始时重新洗牌
     * @returns 当前设置
     */
    public getReshuffleOnRestart(): boolean {
        return this._reshuffleOnRestart;
    }

    /**
     * 恢复原始子节点顺序
     * @description 将子节点顺序恢复到添加时的原始顺序
     */
    public restoreOriginalOrder(): void {
        if (this._originalOrder) {
            this._children = [...this._originalOrder];
        }
    }

    /**
     * 手动重新洗牌子节点
     * @description 立即重新洗牌子节点顺序，不等待下次开始
     */
    public reshuffleNow(): void {
        if (this._children.length > 1) {
            try {
                ArrayExt.shuffle(this._children);
            } catch (error) {
                console.error('RandomSelector: 手动洗牌时发生错误', error);
            }
        }
    }
}

