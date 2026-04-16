import { ref, computed, } from 'vue';
import type { Chapter, StoryNode, Choice, Effect } from '@/core/types/story';
import { NodeType, EffectType } from '@/core/types/story';

export class StoryEngine {
  // 私有状态
  private chapter = ref<Chapter | null>(null);
  private nodeId = ref<string>('');
  private historyStack = ref<string[]>([]);
  private choiceHistory = ref<Map<string, string>>(new Map());

  // 事件回调
  private onNodeChangeCallbacks: ((node: StoryNode) => void)[] = [];
  private onEffectCallbacks: ((effect: Effect) => void)[] = [];
  private onEndingCallbacks: ((ending: any) => void)[] = [];

  // 只读公开状态
  get currentChapter() {
    return this.chapter.value
  }

  get currentNodeId() {
    return this.nodeId.value
  }


  // 计算属性
  public currentNode = computed<StoryNode | null>(() => {
    if (!this.chapter.value) return null;
    return this.chapter.value.nodes.get(this.nodeId.value) || null;
  });

  public canGoBack = computed(() => this.historyStack.value.length > 1);

  public history = computed(() => [...this.historyStack.value]);

  public progress = computed(() => {
    if (!this.chapter.value) return 0;
    const total = this.chapter.value.nodes.size;
    const visited = new Set(this.historyStack.value).size;
    return Math.round((visited / total) * 100);
  });

  // 加载章节
  loadChapter(chapterData: Chapter, startNodeId?: string): boolean {
    try {
      this.chapter.value = chapterData;
      const startId = startNodeId || chapterData.startNodeId;

      if (!chapterData.nodes.has(startId)) {
        console.error(`起始节点 ${startId} 不存在`);
        return false;
      }

      this.nodeId.value = startId;
      this.historyStack.value = [startId];
      this.choiceHistory.value.clear();

      this.executeNodeEnter();
      return true;
    } catch (error) {
      console.error('加载章节失败:', error);
      return false;
    }
  }

  // 跳转到指定节点
  jumpTo(nodeId: string, recordHistory = true): boolean {
    if (!this.chapter.value) {
      console.error('未加载章节');
      return false;
    }

    const node = this.chapter.value.nodes.get(nodeId);
    if (!node) {
      console.error(`节点 ${nodeId} 不存在`);
      return false;
    }

    // 检查进入条件
    if (node.requiredConditions) {
      const canEnter = this.checkConditions(node.requiredConditions);
      if (!canEnter) {
        console.warn(`不满足进入节点 ${nodeId} 的条件`);
        return false;
      }
    }

    // 更新历史
    if (recordHistory) {
      this.historyStack.value.push(nodeId);
    }

    this.nodeId.value = nodeId;
    this.executeNodeEnter();

    return true;
  }

  // 执行节点进入逻辑
  private executeNodeEnter(): void {
    const node = this.currentNode.value;
    if (!node) return;

    // 触发回调
    this.onNodeChangeCallbacks.forEach(cb => cb(node));

    // 执行进入效果
    if (node.onEnterEffects) {
      node.onEnterEffects.forEach(effect => this.executeEffect(effect));
    }

    // 检查是否是结局
    if (node.type === NodeType.ENDING && node.ending) {
      this.onEndingCallbacks.forEach(cb => cb(node.ending));
    }

    // 处理自动跳转
    if (node.autoNext && !node.autoNext.requireClick) {
      const delay = node.autoNext.delay * 1000;
      setTimeout(() => {
        this.jumpTo(node.autoNext!.nodeId);
      }, delay);
    }
  }

  // 选择分支
  makeChoice(choice: Choice): boolean {
    // 记录选择
    this.choiceHistory.value.set(this.nodeId.value, choice.id);

    // 执行效果
    if (choice.effects) {
      choice.effects.forEach(effect => this.executeEffect(effect));
    }

    // 跳转
    return this.jumpTo(choice.nextNodeId);
  }

  // 执行效果
  private executeEffect(effect: Effect): void {
    this.onEffectCallbacks.forEach(cb => cb(effect));

    // 本地处理某些效果
    switch (effect.type) {
      case EffectType.JUMP:
        if (effect.target) {
          setTimeout(() => this.jumpTo(effect.target), 0);
        }
        break;
      // 其他效果由外部 store 处理
    }
  }

  // 条件检查
  private checkConditions(conditions: any[]): boolean {
    // 这里简化处理，实际应该调用 gameStore
    return conditions.every(() => true);
  }

  // 回溯
  goBack(): boolean {
    if (this.historyStack.value.length <= 1) return false;

    this.historyStack.value.pop();
    const prevNodeId = this.historyStack.value[this.historyStack.value.length - 1];

    // 不记录历史地跳转
    this.nodeId.value = prevNodeId;
    this.executeNodeEnter();

    return true;
  }

  // 跳转到指定历史点
  jumpToHistory(index: number): boolean {
    if (index < 0 || index >= this.historyStack.value.length) return false;

    const targetId = this.historyStack.value[index];
    // 截断历史
    this.historyStack.value = this.historyStack.value.slice(0, index + 1);

    this.nodeId.value = targetId;
    this.executeNodeEnter();

    return true;
  }

  // 获取剧情树（用于调试）
  getStoryTree(): any {
    if (!this.chapter.value) return null;

    const nodes = Array.from(this.chapter.value.nodes.entries());
    const edges: { from: string; to: string; choice?: string }[] = [];

    nodes.forEach(([id, node]) => {
      if (node.choices) {
        node.choices.forEach(choice => {
          edges.push({
            from: id,
            to: choice.nextNodeId,
            choice: choice.text
          });
        });
      }
      if (node.autoNext) {
        edges.push({
          from: id,
          to: node.autoNext.nodeId
        });
      }
    });

    return {
      chapter: this.chapter.value.title,
      nodes: nodes.map(([id]) => id),
      edges,
      visited: this.historyStack.value,
      current: this.nodeId.value
    };
  }

  // 事件订阅
  onNodeChange(callback: (node: StoryNode) => void): () => void {
    this.onNodeChangeCallbacks.push(callback);
    return () => {
      const index = this.onNodeChangeCallbacks.indexOf(callback);
      if (index > -1) this.onNodeChangeCallbacks.splice(index, 1);
    };
  }

  onEffect(callback: (effect: Effect) => void): () => void {
    this.onEffectCallbacks.push(callback);
    return () => {
      const index = this.onEffectCallbacks.indexOf(callback);
      if (index > -1) this.onEffectCallbacks.splice(index, 1);
    };
  }

  onEnding(callback: (ending: any) => void): () => void {
    this.onEndingCallbacks.push(callback);
    return () => {
      const index = this.onEndingCallbacks.indexOf(callback);
      if (index > -1) this.onEndingCallbacks.splice(index, 1);
    };
  }

  // 清理
  dispose(): void {
    this.chapter.value = null;
    this.nodeId.value = '';
    this.historyStack.value = [];
    this.choiceHistory.value.clear();
    this.onNodeChangeCallbacks = [];
    this.onEffectCallbacks = [];
    this.onEndingCallbacks = [];
  }
}