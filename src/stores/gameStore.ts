import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameState, CharacterAttributes, HistoryEntry, GameSettings } from '@/core/types/game';
import { DEFAULT_ATTRIBUTES } from '@/core/types/game';
import type { Condition, Effect } from '@/core/types/story';
import { ConditionType, Operator, EffectType } from '@/core/types/story';
import { StateMachine, GamePhase } from '@/core/engine/StateMachine';

export const useGameStore = defineStore('game', () => {
  // 状态机实例
  const stateMachine = new StateMachine();

  // 当前游戏状态（响应式包装）
  let _phase = ref<GamePhase>(GamePhase.BOOT)
  const _gameState = ref<GameState>(stateMachine.exportState())

  // 设置
  const settings = ref<GameSettings>({
    resolution: '1920x1080',
    fullscreen: false,
    textSpeed: 5,
    masterVolume: 1,
    bgmVolume: 0.8,
    sfxVolume: 1,
    voiceVolume: 1,
    autoSave: true,
    autoSaveInterval: 5,
    skipReadText: false,
    showHiddenHints: false,
    colorBlindMode: false,
    highContrast: false
  });

  // 运行时状态
  const isLoading = ref(false);
  const currentDialogueIndex = ref(0);
  const textComplete = ref(false);
  const isSkipping = ref(false);

  // 计算属性
  const phase = computed(() => _phase.value)
  const gameState = computed(() => _gameState.value)
  const attributes = computed(() => _gameState.value.attributes);
  const flags = computed(() => _gameState.value.flags);
  const items = computed(() => _gameState.value.items);
  const history = computed(() => _gameState.value.history);
  const currentChapter = computed(() => _gameState.value.currentChapter);
  const isNewGamePlus = computed(() => _gameState.value.newGamePlus);

  const canSeeHiddenInfo = computed(() =>
    settings.value.showHiddenHints ||
    _gameState.value.attributes.情报值 >= 70
  );

  const textDisplaySpeed = computed(() => {
    // 根据设置计算打字机速度（毫秒/字）
    const speeds = [100, 80, 60, 40, 30, 20, 15, 10, 5, 2];
    return speeds[settings.value.textSpeed - 1] || 30;
  });

  // 同步状态机状态到本地
  function syncState() {
    _phase.value = stateMachine.currentPhase.value
    _gameState.value = stateMachine.exportState()
  }



  // 条件检查
  function checkCondition(condition: Condition): boolean {
    switch (condition.type) {
      case ConditionType.FLAG:
        const hasFlag = stateMachine.hasFlag(condition.key);
        return condition.operator === Operator.HAS ? hasFlag : !hasFlag;

      case ConditionType.ATTRIBUTE:
        const value = attributes.value[condition.key as keyof CharacterAttributes] || 0;
        switch (condition.operator) {
          case Operator.GT: return value > condition.value;
          case Operator.LT: return value < condition.value;
          case Operator.EQ: return value === condition.value;
          default: return false;
        }

      case ConditionType.ITEM:
        const hasItem = stateMachine.hasItem(condition.key);
        return condition.operator === Operator.HAS ? hasItem : !hasItem;

      case ConditionType.RANDOM:
        return Math.random() < (condition.value || 0.5);

      default:
        return true;
    }
  }

  function checkConditions(conditions?: Condition[]): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => checkCondition(c));
  }

  // 效果执行
  function applyEffect(effect: Effect): void {
    switch (effect.type) {
      case EffectType.SET_FLAG:
        stateMachine.setFlag(effect.target);
        break;

      case EffectType.CHANGE_ATTR:
        stateMachine.changeAttribute(
          effect.target as keyof CharacterAttributes,
          effect.value || 0
        );
        break;

      case EffectType.ADD_ITEM:
        stateMachine.addItem(effect.target);
        break;

      case EffectType.REMOVE_ITEM:
        stateMachine.removeItem(effect.target);
        break;

      case EffectType.DAMAGE:
        stateMachine.changeAttribute('生命值', -(effect.value || 0));
        if (attributes.value.生命值 <= 0) {
          stateMachine.recordDeath();
        }
        break;

      case EffectType.HEAL:
        stateMachine.changeAttribute('生命值', effect.value || 0);
        break;

      case EffectType.UNLOCK:
        if (effect.target.startsWith('chapter.')) {
          stateMachine.unlockChapter(effect.target.substring(8));
        } else if (effect.target.startsWith('ending.')) {
          stateMachine.unlockEnding(effect.target.substring(7));
        } else if (effect.target.startsWith('cg.')) {
          stateMachine.unlockCG(effect.target.substring(3));
        }
        break;
    }
    syncState()
  }

  function applyEffects(effects?: Effect[]): void {
    effects?.forEach(applyEffect);
  }

  // 属性操作
  function changeAttribute(key: keyof CharacterAttributes, delta: number) {
    const result = stateMachine.changeAttribute(key, delta)
    syncState()
    return result
  }

  function setAttribute(key: keyof CharacterAttributes, value: number) {
    stateMachine.setAttribute(key, value);
    syncState()
  }

  // 标记操作
  function setFlag(flag: string) {
    stateMachine.setFlag(flag);
    syncState()
  }

  function hasFlag(flag: string): boolean {
    return stateMachine.hasFlag(flag);
  }

  // 道具操作
  function addItem(item: string) {
    stateMachine.addItem(item);
    syncState()
  }

  function removeItem(item: string) {
    stateMachine.removeItem(item);
    syncState()
  }

  function hasItem(item: string): boolean {
    return stateMachine.hasItem(item);
  }

  // 历史记录
  function addHistory(entry: Omit<HistoryEntry, 'timestamp'>) {
    stateMachine.addHistory(entry);
    syncState()
  }

  // 阶段控制
  function setPhase(newPhase: GamePhase): boolean {
    const success = stateMachine.transition(newPhase);
    if (success) {
      syncState()
    }
    return success;
  }

  // 对话控制
  function nextDialogue() {
    currentDialogueIndex.value++;
  }

  function resetDialogue() {
    currentDialogueIndex.value = 0;
    textComplete.value = false;
  }

  function setTextComplete(complete: boolean) {
    textComplete.value = complete;
  }

  // 游戏流程
  function startNewGame() {
    stateMachine.fullReset();
    stateMachine.transition(GamePhase.CHAPTER_SELECT);
    syncState()
  }

  function startChapter(chapterId: string, nodeId?: string) {
    _gameState.value.currentChapter = chapterId;
    _gameState.value.currentNode = nodeId || 'start';
    _gameState.value.currentChapterStartTime = Date.now();
    currentDialogueIndex.value = 0;
    stateMachine.transition(GamePhase.PLAYING);
    syncState()
  }

  function resetCurrentChapter() {
    stateMachine.resetChapter();
    currentDialogueIndex.value = 0;
  }

  function recordDeath() {
    stateMachine.recordDeath();
  }

  // 解锁内容
  function unlockChapter(chapterId: string) {
    stateMachine.unlockChapter(chapterId);
    syncState()
  }

  function unlockEnding(endingId: string) {
    stateMachine.unlockEnding(endingId);
    syncState()
  }

  function unlockCG(cgId: string) {
    stateMachine.unlockCG(cgId);
    syncState()
  }

  // 设置
  function updateSettings(newSettings: Partial<GameSettings>) {
    Object.assign(settings.value, newSettings);
  }

  // 存档/读档支持
  function exportState(): GameState {
    return stateMachine.exportState();
  }

  function importState(data: any): boolean {
    const success = stateMachine.importState(data);
    if (success) {
      syncState()
    }
    return success;
  }

  // 统计
  function getStats() {
    return stateMachine.getStats();
  }

  return {
    // 状态
    phase,
    gameState,
    settings,
    isLoading,
    currentDialogueIndex,
    textComplete,
    isSkipping,

    // 计算属性
    attributes,
    flags,
    items,
    history,
    currentChapter,
    isNewGamePlus,
    canSeeHiddenInfo,
    textDisplaySpeed,

    // 方法
    checkCondition,
    checkConditions,
    applyEffect,
    applyEffects,
    changeAttribute,
    setAttribute,
    setFlag,
    hasFlag,
    addItem,
    removeItem,
    hasItem,
    addHistory,
    setPhase,
    nextDialogue,
    resetDialogue,
    setTextComplete,
    startNewGame,
    startChapter,
    resetCurrentChapter,
    recordDeath,
    unlockChapter,
    unlockEnding,
    unlockCG,
    updateSettings,
    exportState,
    importState,
    getStats,

    // 原始状态机（供高级使用）
    stateMachine
  };
});