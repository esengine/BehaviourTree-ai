import { Entity, Component } from '@esengine/ecs-framework';
import { Behavior } from '../../behaviourTree/Behavior';
import { TaskStatus } from '../../behaviourTree/TaskStatus';

/**
 * 组件类型定义（兼容性类型）
 */
type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

/**
 * 检查组件是否存在的条件节点
 */
export class HasComponentCondition<T extends Component> extends Behavior<Entity> {
    constructor(private componentType: ComponentType<T>) {
        super();
    }

    public update(entity: Entity): TaskStatus {
        try {
            const hasComponent = entity.hasComponent(this.componentType);
            return hasComponent ? TaskStatus.Success : TaskStatus.Failure;
        } catch (error) {
            console.error('检查组件时发生错误:', error);
            return TaskStatus.Failure;
        }
    }
}

/**
 * 添加组件的动作节点
 */
export class AddComponentAction<T extends Component> extends Behavior<Entity> {
    constructor(
        private componentType: ComponentType<T>,
        private componentFactory?: (...args: any[]) => T
    ) {
        super();
    }

    public update(entity: Entity): TaskStatus {
        try {
            if (entity.hasComponent(this.componentType)) {
                return TaskStatus.Success; // 组件已存在
            }

            if (this.componentFactory) {
                const component = this.componentFactory();
                entity.addComponent(component);
            } else {
                entity.createComponent(this.componentType);
            }
            return TaskStatus.Success;
        } catch (error) {
            console.error('添加组件失败:', error);
            return TaskStatus.Failure;
        }
    }
}

/**
 * 移除组件的动作节点
 */
export class RemoveComponentAction<T extends Component> extends Behavior<Entity> {
    constructor(private componentType: ComponentType<T>) {
        super();
    }

    public update(entity: Entity): TaskStatus {
        try {
            const component = entity.removeComponentByType(this.componentType);
            return component ? TaskStatus.Success : TaskStatus.Failure;
        } catch (error) {
            console.error('移除组件失败:', error);
            return TaskStatus.Failure;
        }
    }
}

/**
 * 检查实体标签的条件节点
 */
export class HasTagCondition extends Behavior<Entity> {
    constructor(private tag: number) {
        super();
    }

    public update(entity: Entity): TaskStatus {
        return entity.tag === this.tag ? TaskStatus.Success : TaskStatus.Failure;
    }
}

/**
 * 操作组件属性的动作节点
 */
export class ModifyComponentAction<T extends Component> extends Behavior<Entity> {
    constructor(
        private componentType: ComponentType<T>,
        private modifier: (component: T) => void
    ) {
        super();
    }

    public update(entity: Entity): TaskStatus {
        try {
            const component = entity.getComponent(this.componentType);
            if (!component) {
                return TaskStatus.Failure;
            }

            this.modifier(component);
            return TaskStatus.Success;
        } catch (error) {
            console.error('修改组件失败:', error);
            return TaskStatus.Failure;
        }
    }
}

/**
 * 等待指定时间的动作节点
 */
export class WaitTimeAction extends Behavior<Entity> {
    private startTime: number = 0;
    private isStarted: boolean = false;

    constructor(private waitTime: number) {
        super();
    }

    public override onStart(): void {
        this.startTime = performance.now();
        this.isStarted = true;
    }

    public update(entity: Entity): TaskStatus {
        if (!this.isStarted) {
            return TaskStatus.Running;
        }

        const elapsed = (performance.now() - this.startTime) / 1000;
        return elapsed >= this.waitTime ? TaskStatus.Success : TaskStatus.Running;
    }

    public override onEnd(): void {
        this.isStarted = false;
    }
}

/**
 * 检查实体是否活跃的条件节点
 */
export class IsActiveCondition extends Behavior<Entity> {
    constructor(private checkHierarchy: boolean = true) {
        super();
    }

    public update(entity: Entity): TaskStatus {
        const isActive = this.checkHierarchy ? entity.activeInHierarchy : entity.active;
        return isActive ? TaskStatus.Success : TaskStatus.Failure;
    }
}

/**
 * 销毁实体的动作节点
 */
export class DestroyEntityAction extends Behavior<Entity> {
    public update(entity: Entity): TaskStatus {
        try {
            entity.destroy();
            return TaskStatus.Success;
        } catch (error) {
            console.error('销毁实体失败:', error);
            return TaskStatus.Failure;
        }
    }
}
