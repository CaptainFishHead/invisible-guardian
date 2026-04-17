import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { SaveData } from '@/core/types/game';
import { SaveManager } from '@/core/engine/SaveManager';
import type { StateMachine } from '@/core/engine/StateMachine';
import { useGameStore } from './gameStore';

export const useProgressStore = defineStore('progress', () => {
  const gameStore = useGameStore();
  const saveManager = new SaveManager(gameStore.stateMachine as unknown as StateMachine);

  const saves = ref<SaveData[]>([]);
  const currentSaveId = ref<string | null>(null);
  const isSaving = ref(false);
  const lastSaveTime = ref(0);

  const hasCurrentSave = computed(() => currentSaveId.value !== null);
  const canQuickSave = computed(() => gameStore.phase === 'playing');
  const canQuickLoad = computed(() => saves.value.some(save => save.type === 'quick'));
  const autoSaves = computed(() => saves.value.filter(save => save.type === 'auto').slice(0, 10));
  const manualSaves = computed(() => saves.value.filter(save => save.type === 'manual'));

  async function loadSaveList() {
    saves.value = await saveManager.getAllSaves();
  }

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

  async function quickLoad(): Promise<boolean> {
    const quickSaveEntry = saves.value.find(save => save.type === 'quick');
    if (!quickSaveEntry) return false;
    return loadSave(quickSaveEntry.id);
  }

  async function manualSave(slotIndex: number, name?: string, screenshot?: string) {
    isSaving.value = true;
    const success = await saveManager.manualSave(slotIndex, name, screenshot);

    if (success) {
      lastSaveTime.value = Date.now();
      await loadSaveList();
      const latestManualSave = saves.value.find(
        save => save.type === 'manual' && save.slotIndex === slotIndex
      );
      currentSaveId.value = latestManualSave?.id ?? null;
    }

    isSaving.value = false;
    return success;
  }

  async function autoSave(screenshot?: string) {
    const success = await saveManager.autoSave(screenshot);
    if (success) {
      await loadSaveList();
    }
    return success;
  }

  async function loadSave(saveId: string): Promise<boolean> {
    const success = await saveManager.loadSave(saveId);
    if (success) {
      currentSaveId.value = saveId;
      gameStore.importState(gameStore.stateMachine.exportState());
    }
    return success;
  }

  async function loadFromSlot(slotIndex: number, type?: SaveData['type']) {
    return saveManager.loadFromSlot(slotIndex, type);
  }

  async function deleteSave(saveId: string) {
    const success = await saveManager.deleteSave(saveId);
    if (success) {
      await loadSaveList();
    }
    return success;
  }

  async function clearSlot(slotIndex: number, type?: SaveData['type']) {
    await saveManager.clearSlot(slotIndex, type);
    await loadSaveList();
  }

  function startAutoSave(callback?: () => void) {
    if (!gameStore.settings.autoSave) return;

    saveManager.startAutoSaveInterval(gameStore.settings.autoSaveInterval, async () => {
      await autoSave();
      callback?.();
    });
  }

  function stopAutoSave() {
    saveManager.stopAutoSaveInterval();
  }

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

  async function getSaveSlots() {
    return saveManager.getSaveSlots();
  }

  return {
    saves,
    currentSaveId,
    isSaving,
    lastSaveTime,
    hasCurrentSave,
    canQuickSave,
    canQuickLoad,
    autoSaves,
    manualSaves,
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
    saveManager
  };
});
