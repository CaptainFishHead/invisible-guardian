// src/data/chapters/chapter1.ts
import type { Chapter } from '@/core/types/story';
import { NodeType } from '@/core/types/story';

export const chapter3: Chapter = {
  id: 'ch1',
  title: '第一章：太阳之影',
  description: '1939年，上海。你叫肖途，是潜伏在汪伪政府的地下党员...',
  cover: '/images/ch1_cover.jpg',
  startNodeId: 'start',

  nodes: new Map([
    // 开场视频
    ['start', {
      id: 'start',
      type: NodeType.VIDEO,
      video: {
        src: '/videos/ch1_opening.mp4',
        canSkip: false
      },
      bgm: '/audio/bgm_tension.mp3',
      autoNext: { nodeId: 'meeting', delay: 0 }
    }],

    // 初次会面
    ['meeting', {
      id: 'meeting',
      type: NodeType.DIALOGUE,
      background: '/images/shanghai_night.jpg',
      dialogue: [
        {
          speaker: '方敏',
          text: '肖途...真的是你吗？两年没见，你变了。',
          emotion: 'surprised',
          position: 'left'
        },
        {
          speaker: '肖途',
          text: '方敏，现在不是叙旧的时候。组织上有任务交给我。',
          emotion: 'serious',
          position: 'right'
        },
        {
          speaker: '方敏',
          text: '什么任务？',
          emotion: 'worried',
          position: 'left'
        }
      ],
      autoNext: { nodeId: 'first_choice', delay: 1 }
    }],

    // 关键选择：是否透露身份
    ['first_choice', {
      id: 'first_choice',
      type: NodeType.CHOICE,
      background: '/images/shanghai_night.jpg',
      dialogue: [{
        speaker: '旁白',
        text: '你面临第一个抉择。方敏是你青梅竹马的恋人，但你的身份是绝密...',
        position: 'center'
      }],
      choices: [
        {
          id: 'tell_truth',
          text: '告诉她你的真实身份（危险）',
          icon: '🔪',
          hiddenInfo: '方敏好感度+20，但可能暴露组织',
          effects: [
            { type: 'setFlag', target: 'knows_identity', value: true },
            { type: 'changeAttr', target: '方敏好感', value: 20 },
            { type: 'changeAttr', target: '警觉度', value: 10 }
          ],
          nextNodeId: 'truth_path'
        },
        {
          id: 'lie',
          text: '隐瞒身份，声称只是普通商人',
          effects: [
            { type: 'setFlag', target: 'lied_to_fangmin', value: true },
            { type: 'changeAttr', target: '警觉度', value: -5 }
          ],
          nextNodeId: 'lie_path'
        },
        {
          id: 'evade',
          text: '转移话题，询问她父亲的情况',
          hiddenInfo: '需要情报值≥50才能看到最佳选项',
          conditions: [{ type: 'attribute', key: '情报值', operator: 'gt', value: 50 }],
          effects: [
            { type: 'changeAttr', target: '情报值', value: 10 },
            { type: 'changeAttr', target: '方敏好感', value: 5 }
          ],
          nextNodeId: 'smart_path'
        }
      ]
    }],

    // 真相分支
    ['truth_path', {
      id: 'truth_path',
      type: 'dialogue',
      background: '/images/secret_meeting.jpg',
      dialogue: [
        {
          speaker: '方敏',
          text: '地下党？你...你知不知道这有多危险！',
          emotion: 'shocked',
          position: 'left'
        },
        {
          speaker: '肖途',
          text: '我知道。但我必须这么做。日本人快要...',
          emotion: 'determined',
          position: 'right'
        }
      ],
      autoNext: { nodeId: 'ambush', delay: 2 }
    }],

    // 伏击场景（QTE）
    ['ambush', {
      id: 'ambush',
      type: 'qte',
      background: '/images/gunfight.jpg',
      video: {
        src: '/videos/ambush.mp4',
        startTime: 0,
        endTime: 5
      },
      // QTE 配置
      qte: {
        prompt: '按空格躲避！',
        key: 'Space',
        timeWindow: 2000,  // 2秒反应时间
        successNode: 'survived',
        failNode: 'death_1'
      }
    }],

    // 死亡结局
    ['death_1', {
      id: 'death_1',
      type: NodeType.ENDING,
      background: '/images/death.jpg',
      dialogue: [{
        speaker: '旁白',
        text: '你牺牲了。在乱世中，信任有时是最昂贵的奢侈品。',
        position: 'center'
      }],
      autoNext: { nodeId: 'game_over', delay: 3 }
    }],

    // 存活继续
    ['survived', {
      id: 'survived',
      type: NodeType.DIALOGUE,
      background: '/images/escape.jpg',
      dialogue: [
        {
          speaker: '庄晓曼',
          text: '身手不错嘛，肖先生。看来组织上派来的人，果然不一般。',
          emotion: 'smile',
          position: 'right'
        }
      ],
      autoNext: { nodeId: 'chapter_end', delay: 1 }
    }]
  ]),

  // 章节结局
  endings: [
    {
      id: 'death_1',
      title: '出师未捷',
      type: 'bad',
      conditions: [{ type: 'flag', key: 'death_1', operator: 'has' }],
      unlockHint: '在伏击场景中反应过慢'
    },
    {
      id: 'survivor',
      title: '幸存者',
      type: 'good',
      conditions: [{ type: 'flag', key: 'survived_ch1', operator: 'has' }],
      unlockHint: '成功通过第一章所有考验'
    }
  ]
};