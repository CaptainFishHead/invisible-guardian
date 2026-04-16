import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SaveData } from '@/core/types/game';
import { SaveManager, } from '@/core/engine/SaveManager';
import { useGameStore } from './gameStore';

export const useProgressStore = defineStore('progress', () => {
  const gameStore = useGameStore();
  const saveManager = new SaveManager(gameStore.stateMachine.value);
  console.log(saveManager, 'saveManager');
  console.log(gameStore.stateMachine);

  // 本地状态
  const saves = ref<SaveData[]>([]);
  const currentSaveId = ref<string | null>(null);
  const isSaving = ref(false);
  const lastSaveTime = ref<number>(0);

  // 计算属性
  const hasCurrentSave = computed(() => currentSaveId.value !== null);
  const canQuickSave = computed(() => gameStore.phase === 'playing');
  const canQuickLoad = computed(() => saves.value.some(s => s.type === 'quick'));

  const autoSaves = computed(() =>
    saves.value.filter(s => s.type === 'auto').slice(0, 10)
  );

  const manualSaves = computed(() =>
    saves.value.filter(s => s.type === 'manual')
  );

  // 加载存档列表
  async function loadSaveList() {
    saves.value = await saveManager.getAllSaves();
  }

  // 快速存档
  async function quickSave(screenshot?: string) {
    if (!canQuickSave.value) return false;

    isSaving.value = true;
    const success = await saveManager.quickSave(screenshot);
    if (success) {
      lastSaveTime.value = Date.now();
      await loadSaveList();
    }
    isSaving.value = false;
    return success;
  }

  // 快速读档
  async function quickLoad(): Promise<boolean> {
    const quickSave = saves.value.find(s => s.type === 'quick');
    if (!quickSave) return false;

    return loadSave(quickSave.id);
  }

  // 手动存档
  async function manualSave(slotIndex: number, name?: string, screenshot?: string) {
    isSaving.value = true;
    const save = await saveManager.manualSave(slotIndex, name, screenshot);
    console.log(save, 'save');

    if (save) {
      lastSaveTime.value = Date.now();
      currentSaveId.value = save.id;
      await loadSaveList();
    }
    isSaving.value = false;
    return save !== null;
  }

  // 自动存档
  async function autoSave(screenshot?: string) {
    const save = await saveManager.autoSave(screenshot);
    if (save) {
      await loadSaveList();
    }
    return save !== null;
  }

  // 读取存档
  async function loadSave(saveId: string): Promise<boolean> {
    const success = await saveManager.loadSave(saveId);
    if (success) {
      currentSaveId.value = saveId;
      // 同步到游戏状态
      // gameStore.gameState = gameStore.stateMachine.gameState;
      // gameStore.phase = gameStore.stateMachine.currentPhase;
      console.log(saveManager['stateMachine'].exportState());

      gameStore.importState(saveManager['stateMachine'].exportState())
    }
    return success;
  }

  // 从槽位读取
  async function loadFromSlot(slotIndex: number, type?: SaveData['type']) {
    return saveManager.loadFromSlot(slotIndex, type);
  }

  // 删除存档
  async function deleteSave(saveId: string) {
    const success = await saveManager.deleteSave(saveId);
    if (success) {
      await loadSaveList();
    }
    return success;
  }

  // 清空槽位
  async function clearSlot(slotIndex: number, type?: SaveData['type']) {
    await saveManager.clearSlot(slotIndex, type);
    await loadSaveList();
  }

  // 开始自动存档
  function startAutoSave(callback?: () => void) {
    if (!gameStore.settings.autoSave) return;
    saveManager.startAutoSaveInterval(
      gameStore.settings.autoSaveInterval,
      async () => {
        await autoSave();
        callback?.();
      }
    );
  }

  // 停止自动存档
  function stopAutoSave() {
    saveManager.stopAutoSaveInterval();
  }

  // 导入/导出
  async function exportSave(saveId: string): Promise<string | null> {
    return saveManager.exportSave(saveId);
  }

  async function importSave(data: string): Promise<boolean> {
    const success = await saveManager.importSave(data);
    if (success) {
      await loadSaveList();
    }
    return success;
  }

  // 获取存档槽位信息
  async function getSaveSlots() {
    return saveManager.getSaveSlots();
  }

  return {
    // 状态
    saves,
    currentSaveId,
    isSaving,
    lastSaveTime,

    // 计算属性
    hasCurrentSave,
    canQuickSave,
    canQuickLoad,
    autoSaves,
    manualSaves,

    // 方法
    loadSaveList,
    quickSave,
    quickLoad,
    manualSave,
    autoSave,
    loadSave,
    loadFromSlot,
    deleteSave,
    clearSlot,
    startAutoSave,
    stopAutoSave,
    exportSave,
    importSave,
    getSaveSlots,

    // 原始管理器
    saveManager
  };
});