import { PRIORITY_CONSTS } from '../priority-const.js';
import { defaultBonusRegistry } from '../registry.js';
import { EXTRA_HP_VALUE } from './index.js';

const SHINE_PET_IDS = [
  164, 165, 166, 284, 285, 286, 310, 311, 312, 409, 410, 411, 442, 443, 444,
  948, 949, 950, 1248, 1249, 1250, 1333, 1334, 1500, 1501, 1502, 1706, 1707,
  1823, 1824, 1825, 1838, 1839, 2009, 2010, 2011, 2186, 2187, 2188, 2197, 2208,
  2209, 2210, 2305, 2312, 2554, 2781, 2782, 2794, 3063, 3076, 3158, 3159, 3160,
  3684, 4440, 4732, 4859,
];

const DARK_PET_IDS = [
  167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 181, 182, 183, 190,
  191, 192, 193, 194, 195, 221, 222, 223, 224, 225, 226, 227, 296, 297, 322,
  323, 324, 354, 355, 356, 357, 358, 359, 433, 434, 435, 436, 437, 438, 439,
  440, 441, 655, 656, 657, 658, 659, 660, 661, 777, 778, 779, 780, 781, 782,
  783, 784, 1180, 1181, 1182, 1183, 1184, 1185, 1186, 1187, 1396, 1397, 1398,
  1399, 1400, 1401, 1402, 1403, 4439,
];

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
    petIds: [306],
    descriptor: {
      id: 'pet-鲁斯王特训',
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
          spd: { min: 0, max: 30 },
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

  defaultBonusRegistry.registerPetBonus({
    petIds: SHINE_PET_IDS,
    descriptor: {
      id: '闪光精灵加成',
      source: '超能加成',
      scope: 'pve',
      priority: PRIORITY_CONSTS.pve.SUPERNONO_BONUS,
      description: '闪光精灵超能加成',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 16,
          def: 16,
          spAtk: 16,
          spDef: 16,
          spd: 8,
        },
      },
    },
  });

  defaultBonusRegistry.registerPetBonus({
    petIds: DARK_PET_IDS,
    descriptor: {
      id: '暗黑精灵加成',
      source: '超能加成',
      scope: 'pve',
      priority: PRIORITY_CONSTS.pve.SUPERNONO_BONUS,
      description: '暗黑精灵超能加成',
      mechanism: {
        kind: 'fixed',
        value: {
          atk: 20,
          def: 10,
          spAtk: 20,
          spDef: 10,
          spd: 5,
        },
      },
    },
  });
}
