import type { Chapter } from '@/core/types/story';
import { NodeType } from '@/core/types/story';

export const chapter1: Chapter = {
  id: 'ch1',
  title: '第一章：重逢',
  subtitle: '潜伏的开始',
  description: '肖途在上海街头与旧识重逢。一次看似偶然的碰面，把他重新拖回更深的风暴里。',
  cover: '/images/chapters/ch1_cover.jpg',
  startNodeId: 'ch1_start',
  nodes: new Map([
    [
      'ch1_start',
      {
        id: 'ch1_start',
        type: NodeType.VIDEO,
        video: {
          src: '/videos/ch1_opening.mp4',
          canSkip: false,
          skipAfter: 30
        },
        bgm: '/audio/bgm/ch1_theme.mp3',
        autoNext: { nodeId: 'ch1_street', delay: 0 }
      }
    ],
    [
      'ch1_street',
      {
        id: 'ch1_street',
        type: NodeType.DIALOGUE,
        background: '/images/chapters/ch1_cover.jpg',
        dialogue: [
          {
            speaker: '旁白',
            text: '1939年的上海，霓虹灯下的繁华掩不住空气里的危险。'
          },
          {
            speaker: '肖途',
            text: '两年了，组织终于重新和我接上线。'
          },
          {
            speaker: '方敏',
            text: '肖途？真的是你吗？'
          }
        ],
        autoNext: { nodeId: 'ch1_choice', delay: 1 }
      }
    ],
    [
      'ch1_choice',
      {
        id: 'ch1_choice',
        type: NodeType.CHOICE,
        background: '/images/chapters/title_new.jpg',
        dialogue: [
          {
            speaker: '旁白',
            text: '方敏望着你，显然在等一个答案。'
          }
        ],
        choices: [
          {
            id: 'tell_truth',
            text: '告诉她你正在执行危险任务',
            description: '换取她的信任',
            nextNodeId: 'ch1_truth_path',
            effects: [
              { type: 'setFlag', target: 'ch1_truth_to_fangmin', value: true },
              { type: 'changeAttr', target: '方敏好感', value: 15 }
            ],
            style: 'danger'
          },
          {
            id: 'lie',
            text: '隐瞒身份，假装只是普通职员',
            description: '保护任务，不透露真相',
            nextNodeId: 'ch1_lie_path',
            effects: [
              { type: 'setFlag', target: 'ch1_lied_to_fangmin', value: true },
              { type: 'changeAttr', target: '方敏好感', value: -10 }
            ]
          },
          {
            id: 'evade',
            text: '转移话题，先打听她父亲的消息',
            description: '更谨慎地探查情报',
            nextNodeId: 'ch1_smart_path',
            effects: [
              { type: 'setFlag', target: 'ch1_knows_secret', value: true },
              { type: 'changeAttr', target: '情报值', value: 10 }
            ],
            style: 'important'
          }
        ]
      }
    ],
    [
      'ch1_truth_path',
      {
        id: 'ch1_truth_path',
        type: NodeType.DIALOGUE,
        background: '/images/chapters/title_new.jpg',
        dialogue: [
          {
            speaker: '方敏',
            text: '你疯了吗？一旦暴露，连命都保不住。'
          },
          {
            speaker: '肖途',
            text: '总得有人留下来，把该做的事情做完。'
          }
        ],
        autoNext: { nodeId: 'ch1_joiner', delay: 1 }
      }
    ],
    [
      'ch1_lie_path',
      {
        id: 'ch1_lie_path',
        type: NodeType.DIALOGUE,
        background: '/images/chapters/title_new.jpg',
        dialogue: [
          {
            speaker: '方敏',
            text: '你变了，变得让我有些认不出了。'
          },
          {
            speaker: '肖途',
            text: '在这样的世道里，人总得先活下去。'
          }
        ],
        autoNext: { nodeId: 'ch1_after_lie', delay: 1 }
      }
    ],
    [
      'ch1_after_lie',
      {
        id: 'ch1_after_lie',
        type: NodeType.DIALOGUE,
        background: '/images/chapters/title_new.jpg',
        dialogue: [
          {
            speaker: '旁白',
            text: '方敏转身离开，你意识到自己刚刚亲手推远了一个仍愿意相信你的人。'
          }
        ],
        autoNext: { nodeId: 'ch1_joiner', delay: 1 }
      }
    ],
    [
      'ch1_smart_path',
      {
        id: 'ch1_smart_path',
        type: NodeType.DIALOGUE,
        background: '/images/chapters/title_new.jpg',
        dialogue: [
          {
            speaker: '方敏',
            text: '我父亲失踪很久了，我一直怀疑这件事和特务科有关。'
          },
          {
            speaker: '肖途',
            text: '这条线索我会继续追下去。'
          }
        ],
        autoNext: { nodeId: 'ch1_reunion', delay: 1 }
      }
    ],
    [
      'ch1_reunion',
      {
        id: 'ch1_reunion',
        type: NodeType.DIALOGUE,
        background: '/images/chapters/title_new.jpg',
        dialogue: [
          {
            speaker: '旁白',
            text: '你们短暂达成了默契，但真正的任务才刚刚开始。'
          }
        ],
        autoNext: { nodeId: 'ch1_joiner', delay: 1 }
      }
    ],
    [
      'ch1_joiner',
      {
        id: 'ch1_joiner',
        type: NodeType.DIALOGUE,
        background: '/images/chapters/happy end.jpg',
        dialogue: [
          {
            speaker: '庄晓曼',
            text: '身手不错，看来我没有认错人。'
          },
          {
            speaker: '肖途',
            text: '你是谁？'
          },
          {
            speaker: '庄晓曼',
            text: '从现在开始，我是你的新联络人。'
          }
        ],
        onEnterEffects: [
          { type: 'setFlag', target: 'ch1_complete', value: true },
          { type: 'changeAttr', target: '庄晓曼好感', value: 10 }
        ],
        autoNext: { nodeId: 'ch1_end', delay: 1.5 }
      }
    ],
    [
      'ch1_end',
      {
        id: 'ch1_end',
        type: NodeType.ENDING,
        background: '/images/chapters/happy end.jpg',
        ending: {
          title: '新的起点',
          type: 'good',
          unlockHint: '完成第一章',
          cg: '/images/chapters/happy end.jpg'
        },
        onEnterEffects: [{ type: 'unlock', target: 'chapter.ch2', value: true }]
      }
    ]
  ]),
  endings: [
    {
      id: 'ch1_good',
      title: '新的起点',
      type: 'good',
      conditions: [{ type: 'flag', key: 'ch1_complete', operator: 'has' }],
      unlockHint: '完成第一章'
    }
  ]
};
