import type { CharacterConfig } from '@/core/types/game';

export const characters: CharacterConfig[] = [
  {
    id: 'xiaotu',
    name: '肖途',
    displayName: '肖途',
    color: '#e74c3c',
    defaultEmotion: 'normal',
    emotions: {
      normal: { image: '/images/characters/xiaotu_normal.png' },
      serious: { image: '/images/characters/xiaotu_serious.png' },
      smile: { image: '/images/characters/xiaotu_smile.png' },
      sad: { image: '/images/characters/xiaotu_sad.png' },
      angry: { image: '/images/characters/xiaotu_angry.png' },
      surprised: { image: '/images/characters/xiaotu_surprised.png' }
    },
    voiceActor: '配音演员A',
    description: '代号"胡蜂"，中共地下党员，潜伏在汪伪政府内部',
    tags: ['主角', '地下党', '潜伏者']
  },
  {
    id: 'fangmin',
    name: '方敏',
    displayName: '方敏',
    color: '#3498db',
    defaultEmotion: 'normal',
    emotions: {
      normal: { image: '/images/characters/fangmin_normal.png' },
      smile: { image: '/images/characters/fangmin_smile.png' },
      worried: { image: '/images/characters/fangmin_worried.png' },
      cry: { image: '/images/characters/fangmin_cry.png' },
      angry: { image: '/images/characters/fangmin_angry.png' }
    },
    voiceActor: '配音演员B',
    description: '肖途的青梅竹马，爱国学生，后期加入地下党',
    tags: ['女主', '学生', '青梅竹马']
  },
  {
    id: 'zhuangxiaoman',
    name: '庄晓曼',
    displayName: '庄晓曼',
    color: '#9b59b6',
    defaultEmotion: 'normal',
    emotions: {
      normal: { image: '/images/characters/zhuang_normal.png' },
      smile: { image: '/images/characters/zhuang_smile.png' },
      serious: { image: '/images/characters/zhuang_serious.png' },
      seduce: { image: '/images/characters/zhuang_seduce.png' }
    },
    voiceActor: '配音演员C',
    description: '汪伪政府特务科高级特务，真实身份复杂',
    tags: ['特务', '神秘', '亦正亦邪']
  },
  {
    id: 'liufeng',
    name: '李峰',
    displayName: '李峰',
    color: '#f39c12',
    defaultEmotion: 'normal',
    emotions: {
      normal: { image: '/images/characters/lifeng_normal.png' },
      angry: { image: '/images/characters/lifeng_angry.png' },
      doubt: { image: '/images/characters/lifeng_doubt.png' }
    },
    voiceActor: '配音演员D',
    description: '特务科科长，老奸巨猾，对肖途始终抱有怀疑',
    tags: ['反派', '特务头子', '多疑']
  },
  {
    id: 'luwangshu',
    name: '陆望舒',
    displayName: '陆望舒',
    color: '#1abc9c',
    defaultEmotion: 'normal',
    emotions: {
      normal: { image: '/images/characters/lu_normal.png' },
      smile: { image: '/images/characters/lu_smile.png' },
      serious: { image: '/images/characters/lu_serious.png' }
    },
    voiceActor: '配音演员E',
    description: '地下党联络员，肖途的单线联系人',
    tags: ['地下党', '联络员', '可靠']
  },
  {
    id: 'narrator',
    name: '旁白',
    displayName: '旁白',
    color: '#95a5a6',
    defaultEmotion: 'normal',
    emotions: {
      normal: { image: '' }
    },
    description: '故事叙述者',
    tags: ['系统']
  }
];

// 角色查找函数
export function getCharacterConfig(name: string): CharacterConfig | undefined {
  // 支持通过displayName或id查找
  return characters.find(c =>
    c.name === name ||
    c.displayName === name ||
    c.id === name.toLowerCase()
  );
}

// 获取角色所有可用表情
export function getCharacterEmotions(characterId: string): string[] {
  const char = characters.find(c => c.id === characterId);
  return char ? Object.keys(char.emotions) : [];
}

// 验证角色配置完整性
export function validateCharacterConfig(): string[] {
  const errors: string[] = [];

  characters.forEach(char => {
    if (!char.emotions[char.defaultEmotion]) {
      errors.push(`角色 ${char.name} 缺少默认表情 ${char.defaultEmotion}`);
    }
  });

  return errors;
}