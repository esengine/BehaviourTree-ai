import { Entity, Component } from '@esengine/ecs-framework';
import { BehaviorTreeBuilder } from '../../behaviourTree/BehaviorTreeBuilder';
import { BehaviorTree } from '../../behaviourTree/BehaviorTree';
import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { 
    HasComponentCondition, 
    AddComponentAction, 
    RemoveComponentAction,
    HasTagCondition,
    ModifyComponentAction,
    WaitTimeAction,
    IsActiveCondition,
    DestroyEntityAction
} from '../behaviors/ECSBehaviors';

/**
 * 组件类型定义
 */
type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

/**
 * ECS特化的行为树构建器
 * 提供方便的ECS相关节点创建方法
 */
export class ECSBehaviorTreeBuilder extends BehaviorTreeBuilder<Entity> {
    
    /**
     * 添加组件存在检查条件
     */
    public hasComponent<T extends Component>(componentType: ComponentType<T>): BehaviorTreeBuilder<Entity> {
        const condition = new HasComponentCondition(componentType);
        return this.conditional((entity: Entity) => condition.update(entity));
    }

    /**
     * 添加组件
     */
    public addComponent<T extends Component>(
        componentType: ComponentType<T>,
        factory?: (...args: any[]) => T
    ): BehaviorTreeBuilder<Entity> {
        const addAction = new AddComponentAction(componentType, factory);
        return this.action((entity: Entity) => addAction.update(entity));
    }

    /**
     * 移除组件
     */
    public removeComponent<T extends Component>(componentType: ComponentType<T>): BehaviorTreeBuilder<Entity> {
        const removeAction = new RemoveComponentAction(componentType);
        return this.action((entity: Entity) => removeAction.update(entity));
    }

    /**
     * 检查实体标签
     */
    public hasTag(tag: number): BehaviorTreeBuilder<Entity> {
        const condition = new HasTagCondition(tag);
        return this.conditional((entity: Entity) => condition.update(entity));
    }

    /**
     * 修改组件属性
     */
    public modifyComponent<T extends Component>(
        componentType: ComponentType<T>,
        modifier: (component: T) => void
    ): BehaviorTreeBuilder<Entity> {
        const modifyAction = new ModifyComponentAction(componentType, modifier);
        return this.action((entity: Entity) => modifyAction.update(entity));
    }

    /**
     * 等待指定时间
     */
    public waitTime(seconds: number): BehaviorTreeBuilder<Entity> {
        const waitAction = new WaitTimeAction(seconds);
        return this.action((entity: Entity) => {
            // 管理WaitAction的生命周期
            if (waitAction.status === TaskStatus.Invalid) {
                waitAction.onStart();
            }
            const result = waitAction.update(entity);
            if (result !== TaskStatus.Running) {
                waitAction.onEnd();
            }
            return result;
        });
    }

    /**
     * 检查实体是否活跃
     */
    public isActive(checkHierarchy: boolean = true): BehaviorTreeBuilder<Entity> {
        const condition = new IsActiveCondition(checkHierarchy);
        return this.conditional((entity: Entity) => condition.update(entity));
    }

    /**
     * 销毁实体
     */
    public destroyEntity(): BehaviorTreeBuilder<Entity> {
        const destroyAction = new DestroyEntityAction();
        return this.action((entity: Entity) => destroyAction.update(entity));
    }

    /**
     * 执行自定义ECS逻辑
     */
    public executeECS(logic: (entity: Entity) => boolean | void): BehaviorTreeBuilder<Entity> {
        return this.action((entity: Entity) => {
            try {
                const result = logic(entity);
                if (typeof result === 'boolean') {
                    return result ? TaskStatus.Success : TaskStatus.Failure;
                }
                return TaskStatus.Success;
            } catch (error) {
                console.error('ECS逻辑执行错误:', error);
                return TaskStatus.Failure;
            }
        });
    }

    /**
     * 条件执行 - 如果条件为真则执行成功，否则失败
     */
    public conditionECS(predicate: (entity: Entity) => boolean): BehaviorTreeBuilder<Entity> {
        return this.conditional((entity: Entity) => {
            try {
                return predicate(entity) ? TaskStatus.Success : TaskStatus.Failure;
            } catch (error) {
                console.error('条件检查错误:', error);
                return TaskStatus.Failure;
            }
        });
    }

    /**
     * 日志输出
     */
    public log(message: string | ((entity: Entity) => string), level: 'info' | 'warn' | 'error' = 'info'): BehaviorTreeBuilder<Entity> {
        return this.action((entity: Entity) => {
            try {
                const msg = typeof message === 'function' ? message(entity) : message;
                const entityInfo = `[实体${entity.id}:${entity.name}]`;
                
                switch (level) {
                    case 'info':
                        console.log(`${entityInfo} ${msg}`);
                        break;
                    case 'warn':
                        console.warn(`${entityInfo} ${msg}`);
                        break;
                    case 'error':
                        console.error(`${entityInfo} ${msg}`);
                        break;
                }
                return TaskStatus.Success;
            } catch (error) {
                console.error('日志输出错误:', error);
                return TaskStatus.Failure;
            }
        });
    }

    /**
     * 构建专用于ECS的行为树
     */
    public buildECSTree(updateInterval: number = 0.1): BehaviorTree<Entity> {
        const rootBehavior = this.build(updateInterval);
        return rootBehavior;
    }
}
