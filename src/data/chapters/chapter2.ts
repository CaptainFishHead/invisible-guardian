import type { Chapter } from '@/core/types/story';
import { NodeType } from '@/core/types/story';

export const chapter2: Chapter = {
  id: 'ch2',
  title: '狩猎者',
  subtitle: '第二章',
  description: '新的身份，新的任务。在特务科的阴影下，每一步都可能是陷阱。',
  cover: '/images/chapters/ch2_cover.jpg',
  startNodeId: 'ch2_start',
  dependencies: ['ch1'],

  nodes: new Map([
    ['ch2_start', {
      id: 'ch2_start',
      type: NodeType.DIALOGUE,
      background: '/images/bg/office.jpg',
      dialogue: [
        {
          speaker: '旁白',
          text: '特务科，上海滩最令人畏惧的地方之一。今天，是你正式报到的一天。',
          position: 'center'
        }
      ],
      autoNext: { nodeId: 'ch2_01', delay: 1 }
    }],

    ['ch2_01', {
      id: 'ch2_01',
      type: NodeType.DIALOGUE,
      background: '/images/bg/office.jpg',
      dialogue: [
        {
          speaker: '李峰',
          text: '肖途？我听说过你。从南京调来的"高材生"。',
          position: 'right',
          emotion: 'doubt'
        },
        {
          speaker: '肖途',
          text: '李科长过奖了。以后还请多多指教。',
          position: 'left',
          emotion: 'normal'
        },
        {
          speaker: '李峰',
          text: '指教不敢当。只是...在这种时候，我们更需要的是忠诚，而不是学历。',
          position: 'right',
          emotion: 'serious'
        }
      ],
      autoNext: { nodeId: 'ch2_choice_01', delay: 1 }
    }],

    // 更多节点...
    ['ch2_choice_01', {
      id: 'ch2_choice_01',
      type: NodeType.CHOICE,
      background: '/images/bg/office.jpg',
      choices: [
        {
          id: 'humble',
          text: '谦虚应对，表示愿意学习',
          effects: [
            { type: 'changeAttr', target: '李峰好感', value: 5 },
            { type: 'changeAttr', target: '警觉度', value: -5 }
          ],
          nextNodeId: 'ch2_humble_path'
        },
        {
          id: 'confident',
          text: '自信回应，展示能力',
          effects: [
            { type: 'changeAttr', target: '李峰好感', value: -5 },
            { type: 'changeAttr', target: '警觉度', value: 10 }
          ],
          nextNodeId: 'ch2_confident_path'
        }
      ]
    }]
  ]),

  // 章节结局
  endings: [
    {
      id: 'ch2_good',
      title: '站稳脚跟',
      type: 'good',
      conditions: [],
      unlockHint: '成功在特务科立足'
    },
    {
      id: 'ch2_bad',
      title: '暴露',
      type: 'bad',
      conditions: [],
      unlockHint: '警觉度达到100'
    }
  ]
};