import { ref, computed } from 'vue';
import Dexie from 'dexie';
import type { SaveData, GameState } from '../types/game';
import type { StateMachine } from './StateMachine';

// IndexedDB 数据库
class SaveDatabase extends Dexie {
  saves!: Dexie.Table<SaveData, string>;

  constructor() {
    super('InvisibleGuardianSaves');
    this.version(1).stores({
      saves: 'id, slotIndex, type, updatedAt'
    });
  }
}

const db = new SaveDatabase();

export class SaveManager {
  private autoSaveInterval = ref<number | null>(null);
  private maxAutoSaves = 10;
  private maxManualSaves = 99;

  // 当前加载的存档
  private currentSaveId = ref<string | null>(null);

  public currentSave = computed(() => this.currentSaveId.value);

  constructor(private stateMachine: StateMachine) {}

  // 创建存档
  async createSave(
    slotIndex: number,
    type: SaveData['type'],
    name?: string,
    screenshot?: string
  ): Promise<SaveData | null> {
    try {
      const gameState = this.stateMachine.exportState();

      const saveData: SaveData = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        slotIndex,
        type,
        name: name || this.generateSaveName(type, gameState),
        chapterId: gameState.currentChapter,
        nodeId: gameState.currentNode,
        screenshot,
        gameState,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        playTime: gameState.totalPlayTime,
        version: '1.0.0'
      };

      // 检查槽位占用
      if (type === 'manual') {
        await this.clearSlot(slotIndex, 'manual');
      } else if (type === 'auto') {
        await this.manageAutoSaves();
      }

      await db.saves.put(saveData);
      this.currentSaveId.value = saveData.id;

      return saveData;
    } catch (error) {
      console.error('创建存档失败:', error);
      return null;
    }
  }

  // 快速存档（固定槽位 0）
  async quickSave(screenshot?: string): Promise<boolean> {
    const save = await this.createSave(0, 'quick', '快速存档', screenshot);
    return save !== null;
  }

  // 自动存档
  async autoSave(screenshot?: string): Promise<boolean> {
    const save = await this.createSave(
      Date.now(), // 使用时间戳作为临时槽位
      'auto',
      undefined,
      screenshot
    );
    return save !== null;
  }

  // 手动存档
  async manualSave(slotIndex: number, name?: string, screenshot?: string): Promise<boolean> {
    if (slotIndex < 1 || slotIndex > this.maxManualSaves) {
      console.error('无效存档槽位');
      return false;
    }
    const save = await this.createSave(slotIndex, 'manual', name, screenshot);
    return save !== null;
  }

  // 加载存档
  async loadSave(saveId: string): Promise<boolean> {
    try {
      const save = await db.saves.get(saveId);
      if (!save) {
        console.error('存档不存在');
        return false;
      }

      const success = this.stateMachine.importState(save.gameState);
      if (success) {
        this.currentSaveId.value = saveId;
      }
      return success;
    } catch (error) {
      console.error('加载存档失败:', error);
      return false;
    }
  }

  // 读取指定槽位最新的存档
  async loadFromSlot(slotIndex: number, type?: SaveData['type']): Promise<boolean> {
    let query = db.saves.where('slotIndex').equals(slotIndex);
    if (type) {
      query = query.and(s => s.type === type);
    }

    const saves = await query.reverse().sortBy('updatedAt');
    if (saves.length === 0) return false;

    return this.loadSave(saves[0].id);
  }

  // 删除存档
  async deleteSave(saveId: string): Promise<boolean> {
    try {
      await db.saves.delete(saveId);
      if (this.currentSaveId.value === saveId) {
        this.currentSaveId.value = null;
      }
      return true;
    } catch (error) {
      console.error('删除存档失败:', error);
      return false;
    }
  }

  // 清空槽位
  async clearSlot(slotIndex: number, type?: SaveData['type']): Promise<void> {
    let query = db.saves.where('slotIndex').equals(slotIndex);
    if (type) {
      query = query.and(s => s.type === type);
    }

    const saves = await query.toArray();
    await db.saves.bulkDelete(saves.map(s => s.id));
  }

  // 获取所有存档
  async getAllSaves(): Promise<SaveData[]> {
    return db.saves.orderBy('updatedAt').reverse().toArray();
  }

  // 获取存档列表（按槽位分组）
  async getSaveSlots(): Promise<Map<number, SaveData[]>> {
    const saves = await db.saves.toArray();
    const slots = new Map<number, SaveData[]>();

    saves.forEach(save => {
      if (!slots.has(save.slotIndex)) {
        slots.set(save.slotIndex, []);
      }
      slots.get(save.slotIndex)!.push(save);
    });

    return slots;
  }

  // 管理自动存档数量
  private async manageAutoSaves(): Promise<void> {
    const autoSaves = await db.saves
      .where('type')
      .equals('auto')
      .sortBy('updatedAt');

    if (autoSaves.length >= this.maxAutoSaves) {
      const toDelete = autoSaves.slice(0, autoSaves.length - this.maxAutoSaves + 1);
      await db.saves.bulkDelete(toDelete.map(s => s.id));
    }
  }

  // 生成存档名称
  private generateSaveName(type: SaveData['type'], state: GameState): string {
    const date = new Date();
    const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

    switch (type) {
      case 'auto':
        return `自动存档 ${timeStr}`;
      case 'quick':
        return '快速存档';
      default:
        return `存档 ${timeStr} - ${state.currentChapter || '未知章节'}`;
    }
  }

  // 开始自动存档定时器
  startAutoSaveInterval(minutes: number, callback?: () => void): void {
    this.stopAutoSaveInterval();

    const ms = minutes * 60 * 1000;
    this.autoSaveInterval.value = window.setInterval(async () => {
      await this.autoSave();
      callback?.();
    }, ms);
  }

  // 停止自动存档
  stopAutoSaveInterval(): void {
    if (this.autoSaveInterval.value) {
      clearInterval(this.autoSaveInterval.value);
      this.autoSaveInterval.value = null;
    }
  }

  // 导出存档（用于云同步或分享）
  async exportSave(saveId: string): Promise<string | null> {
    const save = await db.saves.get(saveId);
    if (!save) return null;
    return btoa(JSON.stringify(save)); // Base64编码
  }

  // 导入存档
  async importSave(data: string): Promise<boolean> {
    try {
      const save: SaveData = JSON.parse(atob(data));
      save.id = `imported_${Date.now()}`;
      save.updatedAt = Date.now();
      await db.saves.put(save);
      return true;
    } catch (error) {
      console.error('导入存档失败:', error);
      return false;
    }
  }

  // 清理旧存档
  async cleanup(): Promise<void> {
    // 保留最近50个自动存档
    const autoSaves = await db.saves
      .where('type')
      .equals('auto')
      .reverse()
      .sortBy('updatedAt');

    if (autoSaves.length > 50) {
      const toDelete = autoSaves.slice(50);
      await db.saves.bulkDelete(toDelete.map(s => s.id));
    }
  }
}