export interface IEventHandler {
    (context: any, parameters?: any): any;
}

export interface IConditionChecker {
    (context: any, parameters?: any): boolean;
}

export class EventRegistry {
    private actionHandlers = new Map<string, IEventHandler>();
    private conditionHandlers = new Map<string, IConditionChecker>();
    
    registerAction(eventName: string, handler: IEventHandler): void {
        this.actionHandlers.set(eventName, handler);
    }
    
    registerCondition(eventName: string, checker: IConditionChecker): void {
        this.conditionHandlers.set(eventName, checker);
    }
    
    getActionHandler(eventName: string): IEventHandler | undefined {
        return this.actionHandlers.get(eventName);
    }
    
    getConditionHandler(eventName: string): IConditionChecker | undefined {
        return this.conditionHandlers.get(eventName);
    }
    
    getAllEventNames(): string[] {
        const actionNames = Array.from(this.actionHandlers.keys());
        const conditionNames = Array.from(this.conditionHandlers.keys());
        return [...new Set([...actionNames, ...conditionNames])];
    }
    
    clear(): void {
        this.actionHandlers.clear();
        this.conditionHandlers.clear();
    }
}

export class GlobalEventRegistry {
    private static instance: EventRegistry | null = null;
    
    static getInstance(): EventRegistry {
        if (!GlobalEventRegistry.instance) {
            GlobalEventRegistry.instance = new EventRegistry();
        }
        return GlobalEventRegistry.instance;
    }
} 