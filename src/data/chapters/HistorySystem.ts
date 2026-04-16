// src/core/engine/HistorySystem.ts
export class HistorySystem {
  private checkpoints: Map<string, HistoryNode> = new Map();

  // 记录关键决策点
  recordDecision(nodeId: string, choiceId: string, stateSnapshot: GameState) {
    this.checkpoints.set(nodeId, {
      nodeId,
      choiceId,
      timestamp: Date.now(),
      stateSnapshot: JSON.parse(JSON.stringify(stateSnapshot)),
      preview: this.generatePreview(nodeId, choiceId)
    });
  }

  // 生成时间轴预览
  generateTimeline(): TimelineEvent[] {
    return Array.from(this.checkpoints.values()).map((cp, index) => ({
      id: cp.nodeId,
      chapter: this.getChapterName(cp.nodeId),
      time: this.formatTime(cp.timestamp),
      preview: cp.preview,
      canJump: index < this.checkpoints.size - 1,  // 不能跳到未来
      stateSnapshot: cp.stateSnapshot
    }));
  }

  // 回溯到指定节点
  async jumpToCheckpoint(nodeId: string, engine: StoryEngine, store: any) {
    const cp = this.checkpoints.get(nodeId);
    if (!cp) throw new Error('Checkpoint not found');

    // 恢复状态
    store.restoreState(cp.stateSnapshot);

    // 重新加载章节并跳转
    const chapter = await loadChapter(cp.stateSnapshot.currentChapter);
    engine.loadChapter(chapter);
    engine.jumpTo(nodeId);

    // 清除该节点之后的所有记录
    this.clearAfter(nodeId);
  }
}