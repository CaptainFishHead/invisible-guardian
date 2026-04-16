import type { Chapter } from '@/core/types/story';
import { NodeType } from '@/core/types/story';

export const chapter1: Chapter = {
  id: 'ch1',
  title: '太阳之影',
  subtitle: '第一章',
  description: '1939年，上海。你叫肖途，两年前被组织安排潜伏进汪伪政府。今天，你收到了一个意想不到的联络信号...',
  cover: '/images/chapters/ch1_cover.jpg',
  startNodeId: 'ch1_start',

  nodes: new Map([
    // 开场视频
    ['ch1_start', {
      id: 'ch1_start',
      type: NodeType.VIDEO,
      video: {
        src: '/videos/ch1_opening.mp4',
        canSkip: false,
        skipAfter: 30
      },
      bgm: '/audio/bgm/ch1_theme.mp3',
      autoNext: { nodeId: 'ch1_01', delay: 0 }
    }],

    // 场景1：街头偶遇
    ['ch1_01', {
      id: 'ch1_01',
      type: NodeType.DIALOGUE,
      background: '/images/bg/shanghai_street.jpg',
      dialogue: [
        {
          speaker: '旁白',
          text: '1939年的上海，霓虹灯下的繁华掩盖不住战争的阴云。你走在法租界的街道上，心中思绪万千。',
          position: 'center',
          delay: 0
        },
        {
          speaker: '肖途',
          text: '（两年多了...组织上终于有消息了吗？）',
          position: 'right',
          emotion: 'serious'
        },
        {
          speaker: '旁白',
          text: '突然，一个熟悉的身影出现在街角。',
          position: 'center'
        }
      ],
      soundEffect: '/audio/sfx/footsteps.mp3',
      autoNext: { nodeId: 'ch1_02', delay: 1 }
    }],

    // 场景2：重逢
    ['ch1_02', {
      id: 'ch1_02',
      type: NodeType.DIALOGUE,
      background: '/images/bg/shanghai_street.jpg',
      dialogue: [
        {
          speaker: '方敏',
          text: '肖途？真的是你吗？',
          position: 'left',
          emotion: 'surprised',
          voice: '/audio/voice/fangmin/surprised_01.mp3'
        },
        {
          speaker: '肖途',
          text: '方敏...好久不见。',
          position: 'right',
          emotion: 'normal'
        },
        {
          speaker: '方敏',
          text: '两年多了，你去了哪里？所有人都以为你...',
          position: 'left',
          emotion: 'worried'
        },
        {
          speaker: '肖途',
          text: '以为我什么？投靠了日本人？',
          position: 'right',
          emotion: 'serious'
        },
        {
          speaker: '方敏',
          text: '我不知道该怎么想。现在的你，穿着汪伪政府的制服，你知道这意味着什么吗？',
          position: 'left',
          emotion: 'angry'
        }
      ],
      bgm: '/audio/bgm/emotional.mp3',
      autoNext: { nodeId: 'ch1_choice_01', delay: 1 }
    }],

    // 关键选择：是否坦白
    ['ch1_choice_01', {
      id: 'ch1_choice_01',
      type: NodeType.CHOICE,
      background: '/images/bg/shanghai_street.jpg',
      dialogue: [
        {
          speaker: '旁白',
          text: '方敏的眼神中充满了疑惑和期待。你的选择可能会改变一切...',
          position: 'center'
        }
      ],
      choices: [
        {
          id: 'tell_truth',
          text: '告诉她你的真实身份（危险）',
          icon: '🔪',
          description: '向方敏坦白你是地下党员',
          hiddenInfo: '方敏好感+20，但可能被监视',
          effects: [
            { type: 'setFlag', target: 'ch1_truth_to_fangmin', value: true },
            { type: 'changeAttr', target: '方敏好感', value: 20 },
            { type: 'changeAttr', target: '警觉度', value: 15 }
          ],
          nextNodeId: 'ch1_truth_path',
          style: 'danger',
          deadline: 10
        },
        {
          id: 'lie',
          text: '隐瞒身份，声称只是普通商人',
          description: '继续伪装身份',
          effects: [
            { type: 'setFlag', target: 'ch1_lied_to_fangmin', value: true },
            { type: 'changeAttr', target: '警觉度', value: -5 }
          ],
          nextNodeId: 'ch1_lie_path'
        },
        {
          id: 'evade',
          text: '转移话题，询问她父亲的情况',
          description: '回避直接回答',
          hiddenInfo: '需要情报值≥50，可获取额外信息',
          conditions: [
            { type: 'attribute', key: '情报值', operator: 'gt', value: 50 }
          ],
          effects: [
            { type: 'changeAttr', target: '情报值', value: 10 },
            { type: 'changeAttr', target: '方敏好感', value: 5 },
            { type: 'setFlag', target: 'ch1_knows_secret', value: true }
          ],
          nextNodeId: 'ch1_smart_path',
          style: 'important'
        }
      ]
    }],

    // 坦白分支
    ['ch1_truth_path', {
      id: 'ch1_truth_path',
      type: NodeType.DIALOGUE,
      background: '/images/bg/secret_meeting.jpg',
      dialogue: [
        {
          speaker: '方敏',
          text: '地下党？你...你知不知道这有多危险！如果被人发现...',
          position: 'left',
          emotion: 'shocked'
        },
        {
          speaker: '肖途',
          text: '我知道。但我必须这么做。日本人侵略我们的国家，我不能袖手旁观。',
          position: 'right',
          emotion: 'serious'
        },
        {
          speaker: '方敏',
          text: '我相信你。但是...有人跟踪我们！',
          position: 'left',
          emotion: 'surprised'
        }
      ],
      soundEffect: '/audio/sfx/gun_cock.mp3',
      autoNext: { nodeId: 'ch1_ambush', delay: 0.5 }
    }],

    // 隐瞒分支
    ['ch1_lie_path', {
      id: 'ch1_lie_path',
      type: NodeType.DIALOGUE,
      background: '/images/bg/shanghai_cafe.jpg',
      dialogue: [
        {
          speaker: '方敏',
          text: '商人？在这种时候？肖途，你变了，变得我不认识了。',
          position: 'left',
          emotion: 'sad'
        },
        {
          speaker: '肖途',
          text: '人总是会变的。这就是生存。',
          position: 'right',
          emotion: 'serious'
        },
        {
          speaker: '方敏',
          text: '是吗...那祝你生意兴隆。',
          position: 'left',
          emotion: 'normal'
        },
        {
          speaker: '旁白',
          text: '方敏转身离去，背影中带着失望。你心中五味杂陈，但这是潜伏者的宿命。',
          position: 'center'
        }
      ],
      effects: [
        { type: 'changeAttr', target: '方敏好感', value: -10 }
      ],
      autoNext: { nodeId: 'ch1_after_lie', delay: 2 }
    }],

    // 聪明分支
    ['ch1_smart_path', {
      id: 'ch1_smart_path',
      type: NodeType.DIALOGUE,
      background: '/images/bg/shanghai_street.jpg',
      dialogue: [
        {
          speaker: '方敏',
          text: '我父亲？他...他被日本人抓走了。',
          position: 'left',
          emotion: 'sad'
        },
        {
          speaker: '肖途',
          text: '（果然...这就是组织让我查的事）',
          position: 'right',
          emotion: 'serious'
        },
        {
          speaker: '肖途',
          text: '我会想办法的。相信我。',
          position: 'right',
          emotion: 'normal'
        },
        {
          speaker: '方敏',
          text: '你...你真的愿意帮忙？',
          position: 'left',
          emotion: 'surprised'
        }
      ],
      autoNext: { nodeId: 'ch1_reunion', delay: 1 }
    }],

    // 伏击场景（QTE）
    ['ch1_ambush', {
      id: 'ch1_ambush',
      type: NodeType.QTE,
      background: '/images/bg/gunfight.jpg',
      video: {
        src: '/videos/ch1_ambush.mp4',
        pauseAt: [2]
      },
      qte: {
        prompt: '按空格躲避！',
        key: 'Space',
        timeWindow: 2000,
        successNodeId: 'ch1_survived',
        failNodeId: 'ch1_death_01'
      },
      bgm: '/audio/bgm/action.mp3'
    }],

    // 死亡结局1
    ['ch1_death_01', {
      id: 'ch1_death_01',
      type: NodeType.ENDING,
      background: '/images/bg/death.jpg',
      dialogue: [
        {
          speaker: '旁白',
          text: '枪声响起，你倒在了血泊中。在乱世中，信任有时是最昂贵的奢侈品。',
          position: 'center'
        },
        {
          speaker: '旁白',
          text: '【结局：出师未捷】',
          position: 'center'
        }
      ],
      ending: {
        title: '出师未捷',
        type: 'bad',
        unlockHint: '在伏击场景中反应过慢',
        cg: '/images/cg/death_01.jpg'
      },
      onEnterEffects: [
        { type: 'damage', target: '生命值', value: 100 }
      ]
    }],

    // 存活
    ['ch1_survived', {
      id: 'ch1_survived',
      type: NodeType.DIALOGUE,
      background: '/images/bg/escape.jpg',
      dialogue: [
        {
          speaker: '庄晓曼',
          text: '身手不错嘛，肖先生。看来组织上派来的人，果然不一般。',
          position: 'right',
          emotion: 'smile'
        },
        {
          speaker: '肖途',
          text: '你是...？',
          position: 'left',
          emotion: 'surprised'
        },
        {
          speaker: '庄晓曼',
          text: '你的新联络人。叫我"胡蜂"就好。',
          position: 'right',
          emotion: 'serious'
        },
        {
          speaker: '旁白',
          text: '新的篇章，就此展开...',
          position: 'center'
        }
      ],
      effects: [
        { type: 'setFlag', target: 'ch1_complete', value: true },
        { type: 'changeAttr', target: '庄晓曼好感', value: 10 }
      ],
      autoNext: { nodeId: 'ch1_end', delay: 3 }
    }],

    // 章节结束
    ['ch1_end', {
      id: 'ch1_end',
      type: NodeType.ENDING,
      background: '/images/bg/ch1_end.jpg',
      ending: {
        title: '新的起点',
        type: 'good',
        unlockHint: '成功通过第一章',
        cg: '/images/cg/ch1_clear.jpg'
      },
      onEnterEffects: [
        { type: 'unlock', target: 'chapter.ch2', value: true }
      ]
    }]
  ]),

  // 章节结局
  endings: [
    {
      id: 'ch1_death_01',
      title: '出师未捷',
      type: 'bad',
      conditions: [{ type: 'flag', key: 'ch1_death_01', operator: 'has' }],
      unlockHint: '在伏击场景中失败'
    },
    {
      id: 'ch1_good',
      title: '新的起点',
      type: 'good',
      conditions: [{ type: 'flag', key: 'ch1_complete', operator: 'has' }],
      unlockHint: '成功完成第一章'
    }
  ]
};