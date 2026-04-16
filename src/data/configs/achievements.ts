import type { Achievement } from '@/core/types/game';

export const achievements: Achievement[] = [
  {
    id: 'first_blood',
    name: '初次牺牲',
    description: '第一次死亡',
    icon: '/images/achievements/first_blood.png',
    secret: false,
    conditions: [{ type: 'death', key: 'count', value: 1 }]
  },
  {
    id: 'survivor',
    name: '幸存者',
    description: '完成第一章而不死亡',
    icon: '/images/achievements/survivor.png',
    secret: false,
    conditions: [
      { type: 'flag', key: 'ch1_complete', value: true },
      { type: 'death', key: 'chapter', value: 0 }
    ]
  },
  {
    id: 'truth_seeker',
    name: '真相追寻者',
    description: '解锁所有隐藏剧情',
    icon: '/images/achievements/truth.png',
    secret: true,
    conditions: [{ type: 'custom', key: 'all_hidden', value: true }]
  },
  {
    id: 'heart_breaker',
    name: '芳心纵火犯',
    description: '同时获得方敏和庄晓曼的好感度超过80',
    icon: '/images/achievements/heart.png',
    secret: false,
    conditions: [
      { type: 'attribute', key: '方敏好感', value: 80 },
      { type: 'attribute', key: '庄晓曼好感', value: 80 }
    ]
  },
  {
    id: 'master_spy',
    name: '王牌特工',
    description: '情报值达到100',
    icon: '/images/achievements/spy.png',
    secret: false,
    conditions: [{ type: 'attribute', key: '情报值', value: 100 }]
  },
  {
    id: 'hundred_deaths',
    name: '百死不悔',
    description: '死亡100次',
    icon: '/images/achievements/death.png',
    secret: false,
    conditions: [{ type: 'death', key: 'count', value: 100 }]
  },
  {
    id: 'speed_runner',
    name: '速通大师',
    description: '在2小时内通关游戏',
    icon: '/images/achievements/speed.png',
    secret: false,
    conditions: [{ type: 'playtime', key: 'total', value: 7200 }]
  },
  {
    id: 'completionist',
    name: '完美主义者',
    description: '解锁所有结局',
    icon: '/images/achievements/complete.png',
    secret: false,
    conditions: [{ type: 'custom', key: 'all_endings', value: true }]
  },
  {
    id: 'shadow',
    name: '真正的隐形守护者',
    description: '完成真结局',
    icon: '/images/achievements/shadow.png',
    secret: true,
    conditions: [{ type: 'ending', key: 'true_ending', value: true }]
  }
];

// 成就检查
export function checkAchievement(
  achievement: Achievement,
  gameState: any
): boolean {
  return achievement.conditions.every(condition => {
    switch (condition.type) {
      case 'flag':
        return gameState.flags.has(condition.key);
      case 'ending':
        return gameState.unlockedEndings.includes(condition.key);
      case 'attribute':
        return (gameState.attributes[condition.key] || 0) >= condition.value;
      case 'death':
        if (condition.key === 'count') {
          return gameState.deathCount >= condition.value;
        }
        return true;
      case 'playtime':
        return gameState.totalPlayTime >= condition.value;
      default:
        return false;
    }
  });
}

// 获取所有未解锁的隐藏成就
export function getSecretAchievements(): Achievement[] {
  return achievements.filter(a => a.secret);
}