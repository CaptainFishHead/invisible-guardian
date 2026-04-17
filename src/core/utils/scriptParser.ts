import type { Chapter, StoryNode, ChapterData } from '../types/story';
import { NodeType } from '../types/story';

// 简易剧本格式解析器（支持YAML-like格式或JSON）
export class ScriptParser {
  // 解析章节数据
  static parseChapter(data: any): Chapter {
    const nodes = new Map<string, StoryNode>();

    // 转换节点数组为Map
    if (Array.isArray(data.nodes)) {
      data.nodes.forEach((node: StoryNode) => {
        nodes.set(node.id, this.normalizeNode(node));
      });
    } else if (typeof data.nodes === 'object') {
      Object.entries(data.nodes).forEach(([id, node]: [string, any]) => {
        nodes.set(id, this.normalizeNode({ ...node, id }));
      });
    }

    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      cover: data.cover,
      startNodeId: data.startNodeId,
      nodes,
      endings: data.endings || [],
      dependencies: data.dependencies || [],
      unlockConditions: data.unlockConditions || []
    };
  }

  // 规范化节点数据
  private static normalizeNode(node: any): StoryNode {
    return {
      id: node.id,
      type: node.type || NodeType.DIALOGUE,
      video: node.video,
      background: node.background,
      dialogue: node.dialogue,
      choices: node.choices,
      qte: node.qte,
      investigation: node.investigation,
      autoNext: node.autoNext,
      ending: node.ending,
      bgm: node.bgm,
      soundEffect: node.soundEffect,
      bgmVolume: node.bgmVolume ?? 1,
      requiredConditions: node.requiredConditions,
      onEnterEffects: node.onEnterEffects,
      metadata: node.metadata
    };
  }

  // 从YAML-like文本解析（简化版）
  static parseFromText(text: string): Chapter {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const data: any = { nodes: [] };
    let currentNode: any = null;
    let currentSection: string | null = null;

    for (const line of lines) {
      // 章节信息
      if (line.startsWith('# ')) {
        data.title = line.substring(2);
      } else if (line.startsWith('ID: ')) {
        data.id = line.substring(4);
      } else if (line.startsWith('COVER: ')) {
        data.cover = line.substring(7);
      } else if (line.startsWith('START: ')) {
        data.startNodeId = line.substring(7);
      }

      // 新节点
      else if (line.startsWith('## ')) {
        if (currentNode) data.nodes.push(currentNode);
        currentNode = { id: line.substring(3), dialogue: [] };
        currentSection = null;
      }

      // 节点属性
      else if (currentNode) {
        if (line.startsWith('TYPE: ')) {
          currentNode.type = line.substring(6);
        } else if (line.startsWith('BG: ')) {
          currentNode.background = line.substring(4);
        } else if (line.startsWith('VIDEO: ')) {
          currentNode.video = { src: line.substring(7) };
        } else if (line.startsWith('BGM: ')) {
          currentNode.bgm = line.substring(5);
        }

        // 对话
        else if (line.startsWith('[') && line.includes(']: ')) {
          const match = line.match(/\[(.*?)\]:\s*(.*)/);
          if (match) {
            currentNode.dialogue.push({
              speaker: match[1],
              text: match[2]
            });
          }
        }

        // 选择
        else if (line.startsWith('- ') && line.includes(' -> ')) {
          if (!currentNode.choices) currentNode.choices = [];
          const match = line.match(/-\s*(.*?)\s*->\s*(.*)/);
          if (match) {
            currentNode.choices.push({
              id: `choice_${currentNode.choices.length}`,
              text: match[1],
              nextNodeId: match[2]
            });
          }
        }

        // 跳转
        else if (line.startsWith('-> ')) {
          currentNode.autoNext = {
            nodeId: line.substring(3),
            delay: 0
          };
        }
      }
    }

    if (currentNode) data.nodes.push(currentNode);

    return this.parseChapter(data);
  }

  // 验证章节数据完整性
  static validateChapter(chapter: Chapter): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查必需字段
    if (!chapter.id) errors.push('缺少章节ID');
    if (!chapter.title) errors.push('缺少章节标题');
    if (!chapter.startNodeId) errors.push('缺少起始节点ID');

    // 检查起始节点存在
    if (!chapter.nodes.has(chapter.startNodeId)) {
      errors.push(`起始节点 ${chapter.startNodeId} 不存在`);
    }

    // 检查所有跳转目标存在
    chapter.nodes.forEach((node, id) => {
      // 检查选择跳转
      if (node.choices) {
        node.choices.forEach((choice, idx) => {
          if (!chapter.nodes.has(choice.nextNodeId)) {
            errors.push(`节点 ${id} 的选择 ${idx} 跳转到不存在的节点 ${choice.nextNodeId}`);
          }
        });
      }

      // 检查自动跳转
      if (node.autoNext && !chapter.nodes.has(node.autoNext.nodeId)) {
        errors.push(`节点 ${id} 的自动跳转目标 ${node.autoNext.nodeId} 不存在`);
      }

      // 检查QTE跳转
      if (node.qte) {
        if (!chapter.nodes.has(node.qte.successNodeId)) {
          errors.push(`节点 ${id} 的QTE成功目标不存在`);
        }
        if (!chapter.nodes.has(node.qte.failNodeId)) {
          errors.push(`节点 ${id} 的QTE失败目标不存在`);
        }
      }
    });

    // 检查死节点（没有出边的非结局节点）
    chapter.nodes.forEach((node, id) => {
      if (node.type === NodeType.ENDING) return;

      const hasExit = node.choices?.length ||
        node.autoNext ||
        node.qte ||
        node.investigation;

      if (!hasExit) {
        errors.push(`节点 ${id} 没有出口（可能遗漏了跳转配置）`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 生成章节统计
  static generateStats(chapter: Chapter): object {
    const stats = {
      totalNodes: chapter.nodes.size,
      byType: {} as Record<string, number>,
      totalChoices: 0,
      totalDialogues: 0,
      totalEndings: chapter.endings.length,
      averageChoicesPerNode: 0,
      complexity: 'low' as 'low' | 'medium' | 'high'
    };

    chapter.nodes.forEach(node => {
      // 类型统计
      stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;

      // 选择统计
      if (node.choices) {
        stats.totalChoices += node.choices.length;
      }

      // 对话统计
      if (node.dialogue) {
        stats.totalDialogues += node.dialogue.length;
      }
    });

    stats.averageChoicesPerNode = stats.totalChoices / stats.totalNodes;

    // 复杂度评估
    if (stats.totalNodes > 100 || stats.totalChoices > 50) {
      stats.complexity = 'high';
    } else if (stats.totalNodes > 50 || stats.totalChoices > 20) {
      stats.complexity = 'medium';
    }

    return stats;
  }

  // 导出为JSON
  static exportToJSON(chapter: Chapter): string {
    const exportData: ChapterData = {
      chapter: {
        ...chapter,
        nodes: undefined as any,
        nodesArray: Array.from(chapter.nodes.values()).map(node => ({ ...node }))
      } as any,
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  // 从JSON导入
  static importFromJSON(json: string): Chapter | null {
    try {
      const data = JSON.parse(json);
      if (data.chapter.nodesArray) {
        data.chapter.nodes = new Map(
          data.chapter.nodesArray.map((n: any) => [n.id, n])
        );
        delete data.chapter.nodesArray;
      }
      return this.parseChapter(data.chapter);
    } catch (error) {
      console.error('导入失败:', error);
      return null;
    }
  }
}
