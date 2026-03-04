/**
 * 错误监控系统
 * 包含：错误捕获、用户行为录制、SourceMap 解析、日志分级上报
 */

import { v4 as uuidv4 } from 'uuid';

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// 错误等级配置
const ERROR_LEVEL_CONFIG = {
  [LogLevel.DEBUG]: { send: false, level: 'debug' },
  [LogLevel.INFO]: { send: false, level: 'info' },
  [LogLevel.WARN]: { send: true, level: 'warn' },  // 上报 warn 及以上
  [LogLevel.ERROR]: { send: true, level: 'error' },
  [LogLevel.CRITICAL]: { send: true, level: 'critical' }
};

// 错误监控配置
interface MonitorConfig {
  endpoint: string;                    // 上报地址
  appId: string;                      // 应用 ID
  appVersion: string;                 // 应用版本
  env: 'dev' | 'prod';                // 环境
  level?: LogLevel;                   // 最低上报级别
  sourceMapUrl?: string;               // SourceMap 地址
  maxQueueSize?: number;               // 最大队列数
  flushInterval?: number;              // 上报间隔(ms)
  enableRecorder?: boolean;            // 是否启用行为录制
  sampleRate?: number;                 // 采样率 0-1
}

interface ErrorInfo {
  id: string;
  type: 'js' | 'promise' | 'vue' | 'resource' | 'api';
  level: LogLevel;
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  
  // 上下文信息
  userAgent: string;
  url: string;
  viewport: { width: number; height: number };
  networkStatus: 'online' | 'offline';
  memory?: string;                     // 内存使用情况
  performance?: PerformanceResourceTiming[];
  
  // 用户信息
  userId?: string;
  userTags?: Record<string, string>;
  
  // 用户行为
  actions: UserAction[];
  breadcrumb: BreadcrumbItem[];
  
  // SourceMap 解析后的堆栈
  mappedStack?: MappedStackFrame[];
}

interface UserAction {
  type: 'click' | 'input' | 'navigation' | 'scroll' | 'custom';
  x?: number;
  y?: number;
  target?: string;
  value?: string;
  timestamp: number;
  data?: any;
}

interface BreadcrumbItem {
  type: 'action' | 'error' | 'navigation' | 'custom';
  message: string;
  timestamp: number;
  data?: any;
}

interface MappedStackFrame {
  file: string;
  line: number;
  column: number;
  functionName: string;
  originalCode?: string;
}

class ErrorMonitor {
  private config: MonitorConfig;
  private queue: ErrorInfo[] = [];
  private userId: string;
  private userTags: Record<string, string> = {};
  private actions: UserAction[] = [];
  private breadcrumb: BreadcrumbItem[] = [];
  private maxBreadcrumb = 100;
  private maxActions = 50;
  private recorder: rrwebRecorder | null = null;
  private isProcessing = false;
  private sessionId: string;

  constructor(config: MonitorConfig) {
    this.config = {
      level: LogLevel.WARN,
      maxQueueSize: 10,
      flushInterval: 5000,
      enableRecorder: true,
      sampleRate: 1,
      ...config
    };
    this.userId = this.getUserId();
    this.sessionId = uuidv4();
    
    this.init();
  }

  private getUserId(): string {
    let userId = localStorage.getItem('monitor_user_id');
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem('monitor_user_id', userId);
    }
    return userId;
  }

  private init() {
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejection();
    this.setupResourceError();
    this.setupVueErrorHandler();
    this.setupPerformanceMonitoring();
    this.setupUserActionTracking();
    
    if (this.config.enableRecorder) {
      this.initRecorder();
    }

    // 定期上报队列中的错误
    setInterval(() => this.flush(), this.config.flushInterval);
  }

  // 设置全局错误处理器
  private setupGlobalErrorHandlers() {
    window.onerror = (message, source, lineno, colno, error) => {
      const errorInfo = this.createErrorInfo('js', error?.message || String(message), error?.stack);
      if (source) errorInfo.filename = source;
      if (lineno) errorInfo.lineno = lineno;
      if (colno) errorInfo.colno = colno;
      
      this.addBreadcrumb({ type: 'error', message: 'JavaScript Error', timestamp: Date.now() });
      this.report(errorInfo);
      
      return false; // 不阻止默认错误处理
    };
  }

  // 设置未处理的 Promise 拒绝
  private setupUnhandledRejection() {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const message = error?.message || 'Unhandled Promise Rejection';
      const stack = error?.stack;
      
      const errorInfo = this.createErrorInfo('promise', message, stack);
      this.addBreadcrumb({ type: 'error', message: 'Unhandled Promise Rejection', timestamp: Date.now() });
      this.report(errorInfo);
    });
  }

  // 设置资源加载错误
  private setupResourceError() {
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        const errorInfo = this.createErrorInfo('resource', `Resource load error: ${target.tagName}`);
        errorInfo.filename = (target as any).src || (target as any).href;
        
        this.addBreadcrumb({ 
          type: 'error', 
          message: `Resource error: ${target.tagName}`, 
          timestamp: Date.now() 
        });
        this.report(errorInfo);
      }
    }, true);
  }

  // 设置 Vue 错误处理器
  private setupVueErrorHandler() {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.Vue) {
      // @ts-ignore
      window.Vue.config.errorHandler = (err, instance, info) => {
        const errorInfo = this.createErrorInfo('vue', err.message, err.stack);
        errorInfo.actions.push({
          type: 'custom',
          timestamp: Date.now(),
          data: { info, componentName: instance?.$options?.name }
        });
        
        this.addBreadcrumb({ 
          type: 'error', 
          message: `Vue Error: ${info}`, 
          timestamp: Date.now() 
        });
        this.report(errorInfo);
      };
    }
  }

  // 性能监控
  private setupPerformanceMonitoring() {
    if ('memory' in performance) {
      // 获取内存信息 (仅 Chrome)
    }
  }

  // 用户行为追踪
  private setupUserActionTracking() {
    // 点击事件
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackAction({
        type: 'click',
        x: event.clientX,
        y: event.clientY,
        target: this.getSelector(target),
        timestamp: Date.now()
      });
    }, { capture: true });

    // 输入事件
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      this.trackAction({
        type: 'input',
        target: this.getSelector(target),
        value: this.sanitizeInput(target.value),
        timestamp: Date.now()
      });
    }, { capture: true });

    // 页面导航
    window.addEventListener('popstate', () => {
      this.trackAction({
        type: 'navigation',
        timestamp: Date.now(),
        data: { url: location.href }
      });
    });
  }

  // 获取元素选择器
  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className && typeof element.className === 'string') {
      return `.${element.className.split(' ')[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  // 脱敏输入内容
  private sanitizeInput(value: string): string {
    if (!value) return '';
    // 脱敏手机号、身份证、密码等敏感信息
    return value
      .replace(/\d{11}/g, '***********')
      .replace(/\d{15,18}/g, '**************')
      .replace(/password|passwd|pwd/gi, '******');
  }

  // 记录用户操作
  trackAction(action: UserAction) {
    this.actions.push(action);
    if (this.actions.length > this.maxActions) {
      this.actions.shift();
    }
    
    // 同时添加到面包屑
    this.addBreadcrumb({
      type: 'action',
      message: `${action.type}: ${action.target || ''}`,
      timestamp: action.timestamp,
      data: action
    });

    // 如果有录制器，也记录
    if (this.recorder) {
      this.recorder.addAction(action);
    }
  }

  // 添加面包屑
  addBreadcrumb(item: BreadcrumbItem) {
    this.breadcrumb.push(item);
    if (this.breadcrumb.length > this.maxBreadcrumb) {
      this.breadcrumb.shift();
    }
  }

  // 创建错误信息对象
  private createErrorInfo(type: ErrorInfo['type'], message: string, stack?: string): ErrorInfo {
    return {
      id: uuidv4(),
      type,
      level: this.getErrorLevel(message, stack),
      message,
      stack,
      timestamp: Date.now(),
      
      userAgent: navigator.userAgent,
      url: location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      networkStatus: navigator.onLine ? 'online' : 'offline',
      memory: (performance as any).memory 
        ? JSON.stringify((performance as any).memory) 
        : undefined,
      
      userId: this.userId,
      userTags: this.userTags,
      
      actions: [...this.actions],
      breadcrumb: [...this.breadcrumb]
    };
  }

  // 判断错误级别
  private getErrorLevel(message: string, stack?: string): LogLevel {
    const msg = (message + (stack || '')).toLowerCase();
    
    // 严重错误关键词
    if (msg.includes('crash') || msg.includes('fatal')) {
      return LogLevel.CRITICAL;
    }
    // 普通错误
    if (msg.includes('error') || msg.includes('exception')) {
      return LogLevel.ERROR;
    }
    // 警告
    if (msg.includes('warn') || msg.includes('deprecate')) {
      return LogLevel.WARN;
    }
    // 信息
    return LogLevel.INFO;
  }

  // 设置用户标签
  setUserTag(key: string, value: string) {
    this.userTags[key] = value;
  }

  // 设置用户 ID
  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('monitor_user_id', userId);
  }

  // 上报错误
  async report(errorInfo: ErrorInfo) {
    // 检查采样率
    if (Math.random() > this.config.sampleRate) {
      console.log('[Monitor] 采样跳过');
      return;
    }

    // 检查错误级别
    const levelConfig = ERROR_LEVEL_CONFIG[errorInfo.level];
    if (!levelConfig?.send) {
      console.log(`[Monitor] 级别 ${levelConfig?.level} 不上报`);
      return;
    }

    // SourceMap 解析
    if (errorInfo.stack && this.config.sourceMapUrl) {
      errorInfo.mappedStack = await this.parseSourceMap(errorInfo.stack);
    }

    this.queue.push(errorInfo);

    // 达到上报数量立即上报
    if (this.queue.length >= this.config.maxQueueSize) {
      await this.flush();
    }
  }

  // 解析 SourceMap
  private async parseSourceMap(stack: string): Promise<MappedStackFrame[]> {
    const frames: MappedStackFrame[] = [];
    const stackLines = stack.split('\n');
    
    for (const line of stackLines) {
      const match = line.match(/at\s+(.*?)\s+\((.*?):(\d+):(\d+)/);
      if (match) {
        const [, functionName, file, line, col] = match;
        // 实际项目中需要调用 SourceMap 解析服务
        frames.push({
          file,
          line: parseInt(line),
          column: parseInt(col),
          functionName: functionName || 'unknown'
        });
      }
    }
    
    return frames;
  }

  // 上报队列中的错误
  async flush() {
    if (this.queue.length === 0 || this.isProcessing) return;
    
    this.isProcessing = true;
    const errors = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: this.config.appId,
          appVersion: this.config.appVersion,
          env: this.config.env,
          sessionId: this.sessionId,
          errors
        })
      });

      if (!response.ok) {
        // 上报失败，放回队列
        this.queue = [...errors, ...this.queue];
      } else {
        console.log(`[Monitor] 上报成功: ${errors.length} 条错误`);
      }
    } catch (error) {
      // 网络错误，放回队列
      this.queue = [...errors, ...this.queue];
    } finally {
      this.isProcessing = false;
    }
  }

  // 初始化行为录制器 (rrweb)
  private initRecorder() {
    // @ts-ignore
    if (typeof rrweb === 'undefined') {
      console.log('[Monitor] rrweb 未加载，跳过行为录制');
      return;
    }
    
    // @ts-ignore
    this.recorder = new rrwebRecorder({
      endpoint: this.config.endpoint.replace('/api/report', '/api/rrweb'),
      sessionId: this.sessionId,
      maxEvents: 100
    });
  }

  // 手动上报日志
  log(level: LogLevel, message: string, data?: any) {
    const levelConfig = ERROR_LEVEL_CONFIG[level];
    if (!levelConfig?.send) return;

    this.report({
      id: uuidv4(),
      type: 'js',
      level,
      message,
      timestamp: Date.now(),
      
      userAgent: navigator.userAgent,
      url: location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      networkStatus: navigator.onLine ? 'online' : 'offline',
      
      userId: this.userId,
      userTags: this.userTags,
      
      actions: [],
      breadcrumb: [{
        type: 'custom',
        message,
        timestamp: Date.now(),
        data
      }]
    });
  }

  // 销毁
  destroy() {
    window.onerror = null;
    window.removeEventListener('unhandledrejection', () => {});
    if (this.recorder) {
      this.recorder.destroy();
    }
  }
}

// rrweb 录制器封装
class rrwebRecorder {
  private events: any[] = [];
  private sessionId: string;
  private endpoint: string;
  private maxEvents: number;
  private timer: any;

  constructor(options: { endpoint: string; sessionId: string; maxEvents: number }) {
    this.endpoint = options.endpoint;
    this.sessionId = options.sessionId;
    this.maxEvents = options.maxEvents;
    
    // @ts-ignore
    if (typeof rrweb !== 'undefined') {
      // @ts-ignore
      rrweb.record({
        emit: (event: any) => {
          this.events.push(event);
          if (this.events.length >= this.maxEvents) {
            this.flush();
          }
        }
      });
    }

    // 定期上传
    this.timer = setInterval(() => this.flush(), 30000);
  }

  addAction(action: UserAction) {
    this.events.push({
      type: 3, // EventType.Custom
      data: { action },
      timestamp: Date.now()
    });
  }

  async flush() {
    if (this.events.length === 0) return;
    
    const events = [...this.events];
    this.events = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events
        })
      });
    } catch (e) {
      // 失败放回
      this.events = [...events, ...this.events];
    }
  }

  destroy() {
    clearInterval(this.timer);
    this.flush();
  }
}

// 创建监控实例
let monitorInstance: ErrorMonitor | null = null;

export function initMonitor(config: MonitorConfig): ErrorMonitor {
  if (monitorInstance) {
    monitorInstance.destroy();
  }
  monitorInstance = new ErrorMonitor(config);
  return monitorInstance;
}

export function getMonitor(): ErrorMonitor | null {
  return monitorInstance;
}

  export { ErrorMonitor };
  export type { ErrorInfo, UserAction, BreadcrumbItem, MonitorConfig };
