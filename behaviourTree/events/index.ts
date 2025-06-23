/**
 * 事件系统模块
 * 
 * 提供完整的事件驱动行为树支持，包括：
 * - EventRegistry: 事件注册表
 * - 事件处理器接口
 * - 全局事件管理
 */

export * from './EventRegistry';

// 便捷的类型别名
export type ActionHandler = (context: any, parameters?: any) => any;
export type ConditionChecker = (context: any, parameters?: any) => boolean; 