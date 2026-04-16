// 角色属性系统（隐形守护者风格）
export interface CharacterAttributes {
  // 核心属性
  肖途好感: number;          // 主角自身信念值
  庄晓曼好感: number;        // 关键角色好感
  方敏好感: number;          // 恋人/青梅竹马好感
  陆望舒好感: number;        // 其他角色
  李峰好感: number;

  // 任务属性
  情报值: number;            // 收集到的情报数量/质量
  警觉度: number;            // 敌人怀疑程度（100暴露）
  生命值: number;            // 生命（0死亡）
  体力值: number;            // 某些行动消耗体力

  // 隐藏属性（玩家不可见）
  潜伏值?: number;           // 潜伏深度
  信仰值?: number;           // 对组织的忠诚
}

// 默认属性值
export const DEFAULT_ATTRIBUTES: CharacterAttributes = {
  肖途好感: 50,
  庄晓曼好感: 50,
  方敏好感: 50,
  陆望舒好感: 50,
  李峰好感: 50,
  情报值: 0,
  警觉度: 0,
  生命值: 100,
  体力值: 100
};

// 游戏状态
export interface GameState {
  // 角色属性
  attributes: CharacterAttributes;

  // 剧情标记（关键选择记录）
  flags: Set<string>;

  // 收集品/道具
  items: string[];

  // 解锁内容
  unlockedCGs: string[];
  unlockedEndings: string[];
  unlockedChapters: string[];

  // 统计数据
  deathCount: number;
  totalPlayTime: number;      // 秒
  currentChapterStartTime: number;

  // 当前进度
  currentChapter: string;
  currentNode: string;

  // 历史记录（用于回溯）
  history: HistoryEntry[];

  // 多周目数据
  newGamePlus: boolean;
  carriedOverFlags: Set<string>; // 继承的标记
}

// 历史记录条目
export interface HistoryEntry {
  nodeId: string;
  chapterId: string;
  timestamp: number;
  choiceId?: string;
  attributesSnapshot: Partial<CharacterAttributes>;
  flagsSnapshot: string[];
}

// 存档数据
export interface SaveData {
  id: string;
  slotIndex: number;          // 存档槽位 0-99
  type: 'auto' | 'quick' | 'manual';

  // 存档信息
  name?: string;
  chapterId: string;
  nodeId: string;
  screenshot?: string;        // Base64缩略图

  // 游戏状态
  gameState: GameState;

  // 元数据
  createdAt: number;
  updatedAt: number;
  playTime: number;           // 该存档的游戏时间

  // 版本控制
  version: string;
}

// 设置选项
export interface GameSettings {
  // 显示
  resolution: string;
  fullscreen: boolean;
  textSpeed: number;          // 文字显示速度 1-10

  // 音频
  masterVolume: number;       // 0-1
  bgmVolume: number;
  sfxVolume: number;
  voiceVolume: number;

  // 游戏
  autoSave: boolean;
  autoSaveInterval: number;   // 分钟
  skipReadText: boolean;      // 已读文本快速跳过
  showHiddenHints: boolean;   // 显示隐藏提示（二周目）

  // 辅助功能
  colorBlindMode: boolean;
  highContrast: boolean;
}

// 成就定义
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  secret: boolean;            // 是否隐藏成就
  conditions: AchievementCondition[];
  unlockedAt?: number;
}

export interface AchievementCondition {
  type: 'flag' | 'ending' | 'attribute' | 'death' | 'playtime' | 'custom';
  key: string;
  value: any;
}

// 角色配置
export interface CharacterConfig {
  id: string;
  name: string;
  displayName: string;
  color: string;              // 名字显示颜色 #RRGGBB
  defaultEmotion: string;
  emotions: {
    [key: string]: {
      image: string;
      thumbnail?: string;
    };
  };
  voiceActor?: string;
  description?: string;
  tags: string[];
}

// 游戏配置
export interface GameConfig {
  title: string;
  version: string;
  chapters: string[];         // 章节顺序
  characters: CharacterConfig[];
  achievements: Achievement[];
  settings: GameSettings;
}