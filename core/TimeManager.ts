/**
 * 时间管理器配置选项
 */
export interface TimeManagerConfig {
    /** 最大帧间时间差（秒） */
    maxDeltaTime?: number;
    /** 时间缩放比例 */
    timeScale?: number;
    /** 是否使用高精度时间 */
    useHighPrecision?: boolean;
}

/**
 * 全局时间管理器
 * 
 * @description
 * 提供高性能的时间管理功能，减少重复的时间计算开销。
 * 使用时间池化技术，在每帧开始时统一计算时间，避免多次调用performance.now()。
 * 
 * @example
 * ```typescript
 * // 在游戏主循环开始时更新时间
 * TimeManager.updateFrame();
 * 
 * // 获取当前时间（无额外计算开销）
 * const currentTime = TimeManager.getCurrentTime();
 * const deltaTime = TimeManager.getDeltaTime();
 * 
 * // 配置时间管理器
 * TimeManager.configure({
 *   maxDeltaTime: 0.1,
 *   timeScale: 1.0,
 *   useHighPrecision: true
 * });
 * ```
 */
export class TimeManager {
    /** 当前时间（秒） */
    private static _currentTime: number = 0;
    
    /** 上一帧时间（秒） */
    private static _lastTime: number = 0;
    
    /** 帧间时间差（秒） */
    private static _deltaTime: number = 0;
    
    /** 未缩放的帧间时间差（秒） */
    private static _unscaledDeltaTime: number = 0;
    
    /** 时间缩放比例 */
    private static _timeScale: number = 1.0;
    
    /** 最大允许的帧间时间差（防止时间跳跃） */
    private static _maxDeltaTime: number = 0.1;
    
    /** 是否使用高精度时间 */
    private static _useHighPrecision: boolean = true;
    
    /** 是否已初始化 */
    private static _initialized: boolean = false;
    
    /** 帧计数器 */
    private static _frameCount: number = 0;
    
    /** 启动时间 */
    private static _startTime: number = 0;
    
    /** 时间更新回调列表 */
    private static _updateCallbacks: Array<(deltaTime: number) => void> = [];



    /**
     * 配置时间管理器
     * @param config 配置选项
     */
    public static configure(config: TimeManagerConfig): void {
        if (config.maxDeltaTime !== undefined) {
            this._maxDeltaTime = Math.max(0.001, config.maxDeltaTime);
        }
        
        if (config.timeScale !== undefined) {
            this._timeScale = Math.max(0, config.timeScale);
        }
        
        if (config.useHighPrecision !== undefined) {
            this._useHighPrecision = config.useHighPrecision;
        }
    }

    /**
     * 初始化时间管理器
     */
    public static initialize(): void {
        if (this._initialized) {
            return;
        }

        const now = this._getSystemTime();
        this._startTime = now;
        this._currentTime = 0;
        this._lastTime = 0;
        this._deltaTime = 0;
        this._unscaledDeltaTime = 0;
        this._frameCount = 0;
        this._initialized = true;
    }

    /**
     * 更新帧时间（应在每帧开始时调用）
     * @param externalDeltaTime 可选的外部提供的时间差
     */
    public static updateFrame(externalDeltaTime?: number): void {
        if (!this._initialized) {
            this.initialize();
        }

        this._frameCount++;
        
        if (externalDeltaTime !== undefined) {
            // 使用外部提供的时间差
            this._unscaledDeltaTime = Math.max(0, externalDeltaTime);
        } else {
            // 计算系统时间差
            const systemTime = this._getSystemTime();
            const currentSystemTime = (systemTime - this._startTime) / 1000;
            
            if (this._frameCount === 1) {
                // 第一帧，设置初始时间
                this._lastTime = currentSystemTime;
                this._unscaledDeltaTime = 0; // 第一帧时间差为0
            } else {
                this._unscaledDeltaTime = currentSystemTime - this._lastTime;
                this._lastTime = currentSystemTime; // 更新lastTime为当前系统时间
            }
        }

        // 限制最大时间差，防止时间跳跃
        this._unscaledDeltaTime = Math.min(this._unscaledDeltaTime, this._maxDeltaTime);
        
        // 应用时间缩放
        this._deltaTime = this._unscaledDeltaTime * this._timeScale;
        
        // 更新当前时间
        this._currentTime += this._deltaTime;

        // 触发时间更新回调
        this._triggerUpdateCallbacks();
    }

    /**
     * 获取系统时间（毫秒）
     */
    private static _getSystemTime(): number {
        return this._useHighPrecision ? performance.now() : Date.now();
    }

    /**
     * 触发时间更新回调
     */
    private static _triggerUpdateCallbacks(): void {
        for (let i = 0; i < this._updateCallbacks.length; i++) {
            try {
                this._updateCallbacks[i]!(this._deltaTime);
            } catch (error) {
                console.error('时间更新回调执行失败:', error);
            }
        }
    }

    /**
     * 获取当前时间（秒）
     * @returns 从初始化开始的累计时间
     */
    public static getCurrentTime(): number {
        return this._currentTime;
    }

    /**
     * 获取帧间时间差（秒）
     * @returns 当前帧与上一帧的时间差
     */
    public static getDeltaTime(): number {
        return this._deltaTime;
    }

    /**
     * 获取未缩放的帧间时间差（秒）
     * @returns 未应用时间缩放的帧间时间差
     */
    public static getUnscaledDeltaTime(): number {
        return this._unscaledDeltaTime;
    }

    /**
     * 获取时间缩放比例
     */
    public static getTimeScale(): number {
        return this._timeScale;
    }

    /**
     * 设置时间缩放比例
     * @param scale 缩放比例，0表示暂停，1表示正常速度
     */
    public static setTimeScale(scale: number): void {
        this._timeScale = Math.max(0, scale);
    }

    /**
     * 获取帧计数
     */
    public static getFrameCount(): number {
        return this._frameCount;
    }

    /**
     * 获取平均帧率
     */
    public static getAverageFPS(): number {
        if (this._currentTime <= 0) {
            return 0;
        }
        return this._frameCount / this._currentTime;
    }

    /**
     * 获取当前帧率
     */
    public static getCurrentFPS(): number {
        if (this._unscaledDeltaTime <= 0) {
            return 0;
        }
        return 1 / this._unscaledDeltaTime;
    }

    /**
     * 添加时间更新回调
     * @param callback 回调函数
     */
    public static addUpdateCallback(callback: (deltaTime: number) => void): void {
        if (this._updateCallbacks.indexOf(callback) === -1) {
            this._updateCallbacks.push(callback);
        }
    }

    /**
     * 移除时间更新回调
     * @param callback 要移除的回调函数
     */
    public static removeUpdateCallback(callback: (deltaTime: number) => void): void {
        const index = this._updateCallbacks.indexOf(callback);
        if (index !== -1) {
            this._updateCallbacks.splice(index, 1);
        }
    }

    /**
     * 清除所有时间更新回调
     */
    public static clearUpdateCallbacks(): void {
        this._updateCallbacks.length = 0;
    }

    /**
     * 重置时间管理器
     */
    public static reset(): void {
        this._initialized = false;
        this._frameCount = 0;
        this._currentTime = 0;
        this._lastTime = 0;
        this._deltaTime = 0;
        this._unscaledDeltaTime = 0;
        this._timeScale = 1.0; // 重置时间缩放
        this._maxDeltaTime = 0.1; // 重置最大时间差
        this.clearUpdateCallbacks();
    }

    /**
     * 获取时间管理器统计信息
     */
    public static getStats(): {
        currentTime: number;
        deltaTime: number;
        unscaledDeltaTime: number;
        timeScale: number;
        frameCount: number;
        averageFPS: number;
        currentFPS: number;
        maxDeltaTime: number;
        useHighPrecision: boolean;
    } {
        return {
            currentTime: this._currentTime,
            deltaTime: this._deltaTime,
            unscaledDeltaTime: this._unscaledDeltaTime,
            timeScale: this._timeScale,
            frameCount: this._frameCount,
            averageFPS: this.getAverageFPS(),
            currentFPS: this.getCurrentFPS(),
            maxDeltaTime: this._maxDeltaTime,
            useHighPrecision: this._useHighPrecision
        };
    }
}

 