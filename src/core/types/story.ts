// ==================== 剧情系统类型 ====================

// 节点类型枚举
export const NodeType = {
  VIDEO: 'video',           // 播放视频
  DIALOGUE: 'dialogue',     // 对话（立绘+文字）
  CHOICE: 'choice',         // 分支选择
  QTE: 'qte',               // 快速反应事件
  INVESTIGATION: 'investigation', // 调查模式
  ENDING: 'ending'          // 结局节点
} as const;
export type NodeType = typeof NodeType[keyof typeof NodeType];

// 条件判断类型
export const ConditionType = {
  FLAG: 'flag',
  ATTRIBUTE: 'attribute',
  ITEM: 'item',
  RANDOM: 'random'
} as const;
export type ConditionType = typeof ConditionType[keyof typeof ConditionType];

// 条件运算符
export const Operator = {
  EQ: 'eq',      // 等于
  GT: 'gt',      // 大于
  LT: 'lt',      // 小于
  HAS: 'has',    // 拥有
  NOT: 'not'     // 不拥有/不等于
} as const;
export type Operator = typeof Operator[keyof typeof Operator];

// 效果类型
export const EffectType = {
  SET_FLAG: 'setFlag',
  CHANGE_ATTR: 'changeAttr',
  ADD_ITEM: 'addItem',
  REMOVE_ITEM: 'removeItem',
  DAMAGE: 'damage',
  HEAL: 'heal',
  JUMP: 'jump',
  UNLOCK: 'unlock',
  PLAY_SOUND: 'playSound'
} as const;
export type EffectType = typeof EffectType[keyof typeof EffectType];

// 条件判断接口
export interface Condition {
  type: ConditionType | string;
  key: string;
  operator: Operator | string;
  value?: any;
}

// 效果定义
export interface Effect {
  type: EffectType | string;
  target: string;
  value?: any;
}

// 分支选项
export interface Choice {
  id: string;
  text: string;
  icon?: string;              // 选项图标（如🔪表示危险）
  description?: string;       // 选项描述
  conditions?: Condition[];   // 显示条件
  effects?: Effect[];         // 选择后的效果
  nextNodeId: string;         // 跳转节点
  hiddenInfo?: string;        // 隐藏提示（需高属性才显示）
  deadline?: number;          // 倒计时（秒），0为无限制
  style?: 'normal' | 'danger' | 'important'; // 选项样式
}

// QTE配置
export interface QTEConfig {
  prompt: string;             // 提示文字
  key: string;                // 按键
  timeWindow: number;         // 反应时间（毫秒）
  successNodeId: string;      // 成功跳转
  failNodeId: string;         // 失败跳转
  allowRetry?: boolean;       // 是否允许重试
}

// 调查点
export interface InvestigationPoint {
  id: string;
  x: number;                  // 坐标百分比 0-100
  y: number;
  radius: number;             // 点击范围半径
  icon?: string;              // 图标
  title: string;
  description: string;
  conditions?: Condition[];   // 显示条件
  effects?: Effect[];         // 调查后的效果
  nextNodeId?: string;        // 调查后跳转（可选）
}

// 对话条目
export interface DialogueEntry {
  speaker: string;
  text: string;
  emotion?: string;           // 表情/立绘切换
  position?: 'left' | 'right' | 'center';
  voice?: string;             // 语音文件
  delay?: number;             // 显示延迟（秒）
}

// 视频配置
export interface VideoConfig {
  src: string;
  startTime?: number;         // 开始时间（秒）
  endTime?: number;           // 结束时间（秒）
  canSkip?: boolean;          // 是否可跳过
  skipAfter?: number;         // 几秒后可跳过
  pauseAt?: number[];         // 在指定时间点暂停（用于插入选择）
}

// 自动跳转配置
export interface AutoNextConfig {
  nodeId: string;
  delay: number;              // 延迟秒数
  requireClick?: boolean;     // 是否需要点击
}

// 剧情节点
export interface StoryNode {
  id: string;
  type: NodeType;
  video?: VideoConfig; // 媒体资源
  background?: string;        // 背景图
  dialogue?: DialogueEntry[];  // 对话内容
  choices?: Choice[];  // 分支选择
  qte?: QTEConfig;   // QTE
  // 调查模式
  investigation?: {
    points: InvestigationPoint[];
    timeLimit?: number;       // 调查时间限制（秒）
    background: string;
  };

  // 自动跳转
  autoNext?: AutoNextConfig;

  // 结局信息
  ending?: {
    title: string;
    type: 'good' | 'bad' | 'hidden' | 'true' | 'normal';
    unlockHint?: string;
    cg?: string;              // 解锁CG
  };

  // 音频
  bgm?: string;
  soundEffect?: string;
  bgmVolume?: number;         // 0-1

  // 进入条件
  requiredConditions?: Condition[];

  // 进入时执行的效果
  onEnterEffects?: Effect[];

  // 元数据
  metadata?: {
    chapter?: string;
    scene?: string;
    tags?: string[];
  };
}

// 结局定义
export interface Ending {
  id: string;
  title: string;
  description?: string;
  type: 'good' | 'bad' | 'hidden' | 'true' | 'normal';
  conditions: Condition[];
  unlockHint: string;
  cg?: string;
  achievementId?: string;
}

// 章节定义
export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  cover: string;
  startNodeId: string;
  nodes: Map<string, StoryNode>;
  endings: Ending[];
  dependencies?: string[];    // 依赖的前置章节
  unlockConditions?: Condition[];
}

// 历史记录条目
export interface HistoryEntry {
  nodeId: string;
  timestamp: number;
  choiceId?: string;          // 如果是选择节点，记录选了什么
  gameStateSnapshot?: any;    // 状态快照（用于回溯）
}

// 剧本数据导出格式
export interface ChapterData {
  chapter: Chapter;
  metadata: {
    version: string;
    author?: string;
    createdAt: string;
    updatedAt: string;
  };
}

// 流程图节点
export interface FlowchartNode {
  id: string;
  type: 'start' | 'scene' | 'choice' | 'ending';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  x: number;
  y: number;
  choices?: Array<{
    text: string;
    selected: boolean;
    effect?: string;
  }>;
  tags?: Array<{
    text: string;
    type: 'good' | 'bad' | 'hidden' | 'normal';
  }>;
  endingType?: 'good' | 'bad' | 'normal' | 'secret' | 'current';
}

//
export interface NodeConnection {
  from: string;
  to: string;
  type: 'default' | 'active' | 'current';
  label?: string;
  condition?: string;
}