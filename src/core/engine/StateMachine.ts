import { ref, computed } from 'vue';
import type { GameState, CharacterAttributes, HistoryEntry } from '../types/game';
import { DEFAULT_ATTRIBUTES } from '../types/game';

export const GamePhase = {
  BOOT: 'boot',           // 启动
  MAIN_MENU: 'mainMenu',  // 主菜单
  CHAPTER_SELECT: 'chapterSelect', // 章节选择
  LOADING: 'loading',     // 加载中
  PLAYING: 'playing',     // 游戏中
  PAUSED: 'paused',       // 暂停
  DIALOGUE: 'dialogue',   // 对话中
  CHOICE: 'choice',       // 选择中
  ANIMATION: 'animation', // 动画中
  ENDING: 'ending',       // 结局播放
  CREDITS: 'credits'      // 制作人员名单
} as const;
export type GamePhase = typeof GamePhase[keyof typeof GamePhase];



export class StateMachine {
  // 当前阶段
  private phase = ref<GamePhase>(GamePhase.BOOT);

  // 游戏状态
  private state = ref<GameState>(this.createInitialState());

  // 时间追踪
  private sessionStartTime = ref<number>(0);
  private lastSaveTime = ref<number>(0);

  // 计算属性
  public currentPhase = computed(() => this.phase.value);
  public gameState = computed(() => this.state.value);

  public isPlaying = computed(() =>
    this.phase.value === GamePhase.PLAYING ||
    this.phase.value === GamePhase.DIALOGUE ||
    this.phase.value === GamePhase.CHOICE
  );

  public canPause = computed(() =>
    this.phase.value === GamePhase.PLAYING ||
    this.phase.value === GamePhase.DIALOGUE
  );

  // 创建初始状态
  private createInitialState(): GameState {
    return {
      attributes: { ...DEFAULT_ATTRIBUTES },
      flags: new Set(),
      items: [],
      unlockedCGs: [],
      unlockedEndings: [],
      unlockedChapters: ['ch1', 'ch2', 'ch3'], // 默认解锁第一章
      deathCount: 0,
      totalPlayTime: 0,
      currentChapterStartTime: 0,
      currentChapter: '',
      currentNode: '',
      history: [],
      newGamePlus: false,
      carriedOverFlags: new Set()
    };
  }

  // 阶段转换
  transition(to: GamePhase): boolean {
    if (this.phase.value === to) {
      return true;
    }

    const validTransitions = this.getValidTransitions();

    if (!validTransitions.includes(to)) {
      console.warn(`非法状态转换: ${this.phase.value} -> ${to}`);
      return false;
    }

    // 执行退出当前阶段的清理
    this.onExitPhase(this.phase.value);

    // 转换
    this.phase.value = to;

    // 执行进入新阶段的初始化
    this.onEnterPhase(to);

    return true;
  }

  // 获取有效转换
  private getValidTransitions(): GamePhase[] {
    const transitions: Record<GamePhase, GamePhase[]> = {
      [GamePhase.BOOT]: [GamePhase.MAIN_MENU, GamePhase.CHAPTER_SELECT, GamePhase.LOADING],
      [GamePhase.MAIN_MENU]: [GamePhase.CHAPTER_SELECT, GamePhase.PLAYING, GamePhase.LOADING],
      [GamePhase.CHAPTER_SELECT]: [GamePhase.MAIN_MENU, GamePhase.LOADING],
      [GamePhase.LOADING]: [
        GamePhase.PLAYING,
        GamePhase.DIALOGUE,
        GamePhase.CHOICE,
        GamePhase.ANIMATION,
        GamePhase.ENDING,
        GamePhase.MAIN_MENU
      ],
      [GamePhase.PLAYING]: [GamePhase.PAUSED, GamePhase.DIALOGUE, GamePhase.CHOICE, GamePhase.ANIMATION, GamePhase.ENDING],
      [GamePhase.PAUSED]: [GamePhase.PLAYING, GamePhase.MAIN_MENU],
      [GamePhase.DIALOGUE]: [GamePhase.PLAYING, GamePhase.CHOICE, GamePhase.ANIMATION, GamePhase.ENDING],
      [GamePhase.CHOICE]: [GamePhase.PLAYING, GamePhase.DIALOGUE],
      [GamePhase.ANIMATION]: [GamePhase.PLAYING, GamePhase.DIALOGUE, GamePhase.CHOICE],
      [GamePhase.ENDING]: [GamePhase.CREDITS, GamePhase.MAIN_MENU],
      [GamePhase.CREDITS]: [GamePhase.MAIN_MENU]
    };

    return transitions[this.phase.value] || [];
  }

  // 进入阶段处理
  private onEnterPhase(phase: GamePhase): void {
    switch (phase) {
      case GamePhase.PLAYING:
        this.sessionStartTime.value = Date.now();
        break;
      case GamePhase.PAUSED:
        this.updatePlayTime();
        break;
    }
  }

  // 退出阶段处理
  private onExitPhase(phase: GamePhase): void {
    switch (phase) {
      case GamePhase.PLAYING:
        this.updatePlayTime();
        break;
    }
  }

  // 更新游戏时间
  private updatePlayTime(): void {
    if (this.sessionStartTime.value > 0) {
      const elapsed = Math.floor((Date.now() - this.sessionStartTime.value) / 1000);
      this.state.value.totalPlayTime += elapsed;
      this.sessionStartTime.value = 0;
    }
  }

  // 修改属性
  changeAttribute(key: keyof CharacterAttributes, delta: number): number {
    const current = this.state.value.attributes[key] || 0;
    const newValue = Math.max(0, Math.min(100, current + delta));
    this.state.value.attributes[key] = newValue;
    return newValue;
  }

  setAttribute(key: keyof CharacterAttributes, value: number): void {
    this.state.value.attributes[key] = Math.max(0, Math.min(100, value));
  }

  setCurrentProgress(chapterId: string, nodeId: string): void {
    this.state.value.currentChapter = chapterId;
    this.state.value.currentNode = nodeId;
    this.state.value.currentChapterStartTime = Date.now();
  }

  // 标记操作
  setFlag(flag: string): void {
    this.state.value.flags.add(flag);
  }

  removeFlag(flag: string): void {
    this.state.value.flags.delete(flag);
  }

  hasFlag(flag: string): boolean {
    return this.state.value.flags.has(flag);
  }

  // 道具操作
  addItem(item: string): void {
    if (!this.state.value.items.includes(item)) {
      this.state.value.items.push(item);
    }
  }

  removeItem(item: string): void {
    const index = this.state.value.items.indexOf(item);
    if (index > -1) {
      this.state.value.items.splice(index, 1);
    }
  }

  hasItem(item: string): boolean {
    return this.state.value.items.includes(item);
  }

  // 历史记录
  addHistory(entry: Omit<HistoryEntry, 'timestamp'>): void {
    this.state.value.history.push({
      ...entry,
      timestamp: Date.now()
    });

    // 限制历史长度
    if (this.state.value.history.length > 1000) {
      this.state.value.history.shift();
    }
  }

  // 解锁内容
  unlockChapter(chapterId: string): void {
    if (!this.state.value.unlockedChapters.includes(chapterId)) {
      this.state.value.unlockedChapters.push(chapterId);
    }
  }

  unlockEnding(endingId: string): void {
    if (!this.state.value.unlockedEndings.includes(endingId)) {
      this.state.value.unlockedEndings.push(endingId);
    }
  }

  unlockCG(cgId: string): void {
    if (!this.state.value.unlockedCGs.includes(cgId)) {
      this.state.value.unlockedCGs.push(cgId);
    }
  }

  // 死亡处理
  recordDeath(): void {
    this.state.value.deathCount++;
  }

  // 准备新游戏+数据
  prepareNewGamePlus(): Partial<GameState> {
    return {
      newGamePlus: true,
      carriedOverFlags: new Set(this.state.value.flags),
      unlockedCGs: [...this.state.value.unlockedCGs],
      unlockedEndings: [...this.state.value.unlockedEndings],
      unlockedChapters: [...this.state.value.unlockedChapters]
    };
  }

  // 重置当前章节
  resetChapter(): void {
    this.state.value.attributes = { ...DEFAULT_ATTRIBUTES };
    this.state.value.flags = new Set(
      [...this.state.value.flags].filter(f => f.startsWith('global.'))
    );
    this.state.value.items = [];
    this.state.value.history = [];
    this.state.value.currentChapterStartTime = Date.now();
  }

  // 完全重置
  fullReset(): void {
    this.state.value = this.createInitialState();
    this.phase.value = GamePhase.MAIN_MENU;
  }

  // 导出状态（用于存档）
  exportState(): GameState {
    return JSON.parse(JSON.stringify({
      ...this.state.value,
      flags: Array.from(this.state.value.flags),
      carriedOverFlags: Array.from(this.state.value.carriedOverFlags)
    }));
  }

  // 导入状态（用于读档）
  importState(data: any): boolean {
    try {
      this.state.value = {
        ...data,
        flags: new Set(data.flags || []),
        carriedOverFlags: new Set(data.carriedOverFlags || [])
      };
      return true;
    } catch (error) {
      console.error('导入状态失败:', error);
      return false;
    }
  }

  // 获取统计
  getStats() {
    return {
      totalPlayTime: this.state.value.totalPlayTime,
      deathCount: this.state.value.deathCount,
      unlockedEndings: this.state.value.unlockedEndings.length,
      totalEndings: 20, // 假设总结局数
      completionRate: this.calculateCompletion()
    };
  }

  private calculateCompletion(): number {
    // 计算游戏完成度
    const factors = [
      this.state.value.unlockedEndings.length * 5,      // 结局 5% each
      this.state.value.unlockedCGs.length * 2,          // CG 2% each
      this.state.value.unlockedChapters.length * 10,    // 章节 10% each
      Math.min(this.state.value.deathCount, 10)         // 死亡收集
    ];
    return Math.min(100, factors.reduce((a, b) => a + b, 0));
  }
}
