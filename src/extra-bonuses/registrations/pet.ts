import { defaultBonusRegistry } from '../registry.js';
import { EXTRA_HP_VALUE } from './index.js';

export function registerPetBonuses(): void {
  defaultBonusRegistry.registerPetBonus({
    petIds: [70, 2394],
    descriptor: {
      id: 'pet-雷伊特训',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description: '雷伊特训加成',
      mechanism: {
        kind: 'pool',
        total: Infinity,
        bounds: {
          atk: { min: 0, max: 20 },
          def: { min: 0, max: 30 },
          hp: { min: 0, max: 60 - EXTRA_HP_VALUE },
          spAtk: { min: 0, max: 10 },
          spDef: { min: 0, max: 20 },
          spd: { min: 0, max: 20 },
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [798, 2323],
    descriptor: {
      id: 'pet-卡修斯特训',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description: '卡修斯特训加成',
      mechanism: {
        kind: 'pool',
        total: Infinity,
        bounds: {
          def: { min: 0, max: 20 },
          spDef: { min: 0, max: 20 },
        },
      },
    },
  });
  defaultBonusRegistry.registerPetBonus({
    petIds: [462, 2484],
    descriptor: {
      id: 'pet-阿尔达拉布尔斯光的历练',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '月光一族布尔斯光的历练，详见[链接](https://www.bilibili.com/opus/932095099690549289)',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 2,
          def: 1,
          hp: 9,
          spAtk: 1,
          spDef: 2,
          spd: 2,
        },
      },
    },
  });
  defaultBonusRegistry.registerPetBonus({
    petIds: [904, 2895],
    descriptor: {
      id: 'pet-阿尔莫尼布尔斯光的历练',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '月光一族布尔斯光的历练，详见[链接](https://www.bilibili.com/opus/932095099690549289)',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 2,
          def: 2,
          hp: 2,
          spAtk: 1,
          spDef: 1,
          spd: 2,
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [916],
    descriptor: {
      id: 'pet-瓦诺恩布尔斯光的历练',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '月光一族布尔斯光的历练，详见[链接](https://www.bilibili.com/opus/932095099690549289)',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 2,
          def: 2,
          hp: 3,
          spAtk: 1,
          spd: 1,
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [303],
    descriptor: {
      id: 'pet-丽莎布布特训',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '详见[链接](https://www.bilibili.com/opus/950240288568246274)',
      mechanism: {
        kind: 'pool',
        total: Infinity,
        bounds: {
          atk: { min: 0, max: 10 },
          def: { min: 0, max: 10 },
          spAtk: { min: 0, max: 10 },
          spDef: { min: 0, max: 10 },
          spd: { min: 0, max: 20 },
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [1526, 1527],
    descriptor: {
      id: 'pet-星灵王七星能量注入特训',
      source: '特殊加成',
      scope: 'base',
      priority: 0,
      description:
        '详见[链接](https://www.bilibili.com/opus/932095099690549289)',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 5,
          def: 5,
          hp: 5,
          spd: 5,
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [1738],
    descriptor: {
      id: 'pet-詹姆斯特训',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '詹姆斯特训加成，详见[链接](https://zhidao.baidu.com/question/567580580.html)',
      mechanism: {
        kind: 'pool',
        total: 10,
        bounds: {
          atk: { min: 0, max: 5 },
          def: { min: 0, max: 5 },
          spAtk: { min: 0, max: 5 },
          spDef: { min: 0, max: 5 },
          spd: { min: 0, max: 5 },
          hp: { min: 0, max: 0 }, // 该部分加成与体力上限共用
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [2347],
    descriptor: {
      id: 'pet-圣迈尔斯特训',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '圣迈尔斯特训加成，详见[链接](https://news.4399.com/gonglue/seer/saiergonglue/201502-11-483366.html)',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 10,
          def: 5,
          hp: 50 - EXTRA_HP_VALUE,
          spAtk: 5,
          spDef: 5,
          spd: 10,
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [2377],
    descriptor: {
      id: 'pet-圣奥斯卡特训',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '圣奥斯卡特训加成，详见[链接](https://news.4399.com/gonglue/seer/saiergonglue/201502-11-483366.html)',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 10,
          def: 10,
          hp: 30 - EXTRA_HP_VALUE,
          spAtk: 5,
          spDef: 5,
          spd: 10,
        },
      },
    },
  });
  defaultBonusRegistry.registerPetBonus({
    petIds: [3311],
    descriptor: {
      id: 'pet-圣光灵神特训',
      source: '基础值加成',
      scope: 'base',
      priority: 0,
      description:
        '圣光灵神特训加成，详见[链接](https://news.4399.com/gonglue/seer/jingyanxinde/726258.html)',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 10,
          def: 18,
          hp: 32 - EXTRA_HP_VALUE,
          spAtk: 0,
          spDef: 20,
          spd: 10,
        },
      },
    },
  });
  defaultBonusRegistry.registerPetBonus({
    petIds: [1114, 1115, 1155, 1156],
    descriptor: {
      id: '血狼一族加成',
      source: '基础值加成',
      scope: 'base_inbattle',
      priority: 0,
      description:
        '血狼一族加成，威沃夫和威里特在背包中会为彼此提供50点体力值加成。',
      mechanism: {
        kind: 'fixed',
        value: {
          hp: 50,
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [1114, 1115, 1155, 1156],
    descriptor: {
      id: '血狼一族加成',
      source: '基础值加成',
      scope: 'base_inbattle',
      priority: 0,
      description:
        '血狼一族加成，威沃夫和威里特在背包中会为彼此提供50点体力加成。',
      mechanism: {
        kind: 'fixed',
        value: {
          hp: 50,
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: [1114, 1115, 1155, 1156, 1956],
    descriptor: {
      id: '血狼一族狼王加成',
      source: '基础值加成',
      scope: 'base_inbattle',
      priority: 0,
      description: `血狼一族狼王加成，当威利克斯，威沃夫，威里特同时在背包中时，三只精灵都会获得20点攻击和体力加成
        该加成仅在对战内及Flash端怀旧或经典背包中可见`,
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 20,
          hp: 20,
        },
      },
    },
  });
}
