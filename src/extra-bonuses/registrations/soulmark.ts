import { Soulmark } from '../../types.js';
import { PRIORITY_CONSTS } from '../priority-const.js';
import { defaultBonusRegistry } from '../registry.js';
import { BonusMechanism, PetBonusContext } from '../types.js';

export function registerSoulmarkBonuses(): void {
  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 247,
    descriptorId: 'soulmark-247',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          hp: args[0] ?? 0,
          atk: args[1] ?? 0,
          def: args[2] ?? 0,
          spAtk: args[3] ?? 0,
          spDef: args[4] ?? 0,
          spd: args[5] ?? 0,
        },
      };
      return {
        id: 'soulmark-247',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '魂印加成，所属魂印eid：247',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 137,
    descriptorId: 'soulmark-137',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          hp: args[0] ?? 0,
          atk: args[1] ?? 0,
          def: args[2] ?? 0,
          spAtk: args[3] ?? 0,
          spDef: args[4] ?? 0,
          spd: args[5] ?? 0,
        },
      };
      return {
        id: 'soulmark-137',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '魂印加成，所属魂印eid：137',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 177,
    descriptorId: 'soulmark-177',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          atkPercent: args[1],
        },
      };
      return {
        id: 'soulmark-177',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '魂印加成，所属魂印eid：177',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 269,
    descriptorId: 'soulmark-269',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          spd: args[5] ?? 0,
        },
      };
      return {
        id: 'soulmark-269',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '魂印加成，所属魂印eid：269',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 372,
    descriptorId: 'soulmark-372',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          hp: args[2],
          atk: args[3],
        },
      };
      return {
        id: 'soulmark-372',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '与斗天武神·瑞尔斯开启的羁绊强化魂印之一',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 626,
    descriptorId: 'soulmark-626',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          defPercent: args[0],
          spDefPercent: args[0],
        },
      };
      return {
        id: 'soulmark-764',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '马尔修斯（坚壁型）魂印加成',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 764,
    descriptorId: 'soulmark-764',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          hp: args[2],
          atk: args[3],
        },
      };
      return {
        id: 'soulmark-764',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '与战神·盖亚开启的羁绊强化魂印',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 715,
    descriptorId: 'soulmark-715',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          hpPercent: args[4],
        },
      };
      return {
        id: 'soulmark-715',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '与乔特鲁德开启的羁绊强化魂印',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 720,
    descriptorId: 'soulmark-720',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          hpPercent: args[4],
        },
      };
      return {
        id: 'soulmark-720',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '与王之哈莫开启的羁绊强化魂印',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 1269,
    descriptorId: 'soulmark-1269',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          def: args[0],
          spDef: args[1],
        },
      };
      return {
        id: 'soulmark-1269',
        source: '专属特性',
        scope: 'pvp',
        priority: PRIORITY_CONSTS.pvp.SOULMARK_BONUS,
        description: '重盾杰西卡魂印加成',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 1289,
    descriptorId: 'soulmark-1289',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          atk: args[0],
          spAtk: args[1],
        },
      };
      return {
        id: 'soulmark-1289',
        source: '专属特性',
        scope: 'pvp',
        priority: PRIORITY_CONSTS.pvp.SOULMARK_BONUS,
        description: '爆裂杰西卡魂印加成',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 1560,
    descriptorId: 'soulmark-1560',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'pick_n',
        options: [
          {
            atk: args[1],
          },
          {
            spd: args[3],
          },
          {
            def: args[5],
            spDef: args[5],
          },
          {
            hp: args[7],
          },
        ],
        pickCount: 1,
      };
      return {
        id: 'soulmark-1560',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '冠绝神龙魂印加成',
        mechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 1570,
    descriptorId: 'soulmark-1570',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'fixed',
        value: {
          hp: args[0],
        },
      };
      return {
        id: 'soulmark-1570',
        source: '专属特性',
        scope: 'pvp',
        priority: PRIORITY_CONSTS.pvp.SOULMARK_BONUS,
        description: '蛮荒之鳄魂印加成',
        mechanism,
      };
    },
  });

  const fanersiMechanism: BonusMechanism = {
    kind: 'transfer_sources',
    spec: {
      fromStat: 'spd',
      sourceNames: ['学习力', '刻印'],
      toStat: 'hp',
      asSource: '专属特性',
      mode: 'overwrite',
    },
  };

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 697,
    descriptorId: 'soulmark-697-transfer',
    buildDescriptor(_soulmark: Soulmark, context: PetBonusContext) {
      void context;
      return {
        id: 'soulmark-697-transfer',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description:
          '对于速度的刻印，学习力强化同时应用于体力（所属精灵：凡尔斯）',
        mechanism: fanersiMechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 1272,
    descriptorId: 'soulmark-1272-transfer',
    buildDescriptor(_soulmark: Soulmark, context: PetBonusContext) {
      void context;
      return {
        id: 'soulmark-1272-transfer',
        source: '专属特性',
        scope: 'pvp',
        priority: PRIORITY_CONSTS.pvp.SOULMARK_BONUS,
        description:
          '对于速度的刻印，学习力强化同时应用于体力（所属精灵：擎空·凡尔斯）',
        mechanism: fanersiMechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 1309,
    descriptorId: 'soulmark-1309-transfer',
    buildDescriptor(_soulmark: Soulmark, context: PetBonusContext) {
      void context;
      return {
        id: 'soulmark-1309-transfer',
        source: '专属特性',
        scope: 'pvp',
        priority: PRIORITY_CONSTS.pvp.SOULMARK_BONUS,
        description:
          '对于速度的刻印，学习力强化同时应用于体力（所属精灵：混沌飞王凡尔斯）',
        mechanism: fanersiMechanism,
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkBonus({
    effectId: 1605,
    descriptorId: 'soulmark-1605',
    buildDescriptor(soulmark: Soulmark, context: PetBonusContext) {
      void context;
      const { args } = soulmark;
      const mechanism: BonusMechanism = {
        kind: 'pick_n',
        options: [
          {
            atk: args[0],
          },
          {
            spd: args[2],
          },
          {
            def: args[4],
            spDef: args[4],
          },
          {
            hp: args[6],
          },
        ],
        pickCount: 1,
      };
      return {
        id: 'soulmark-1605',
        source: '专属特性',
        scope: 'base',
        priority: PRIORITY_CONSTS.base.SOULMARK_BONUS,
        description: '天幕神龙魂印加成',
        mechanism,
      };
    },
  });
}

export function registerSoulmarkTransforms(): void {
  // defaultBonusRegistry.registerSoulmarkTransform({
  //   effectId: 297,
  //   descriptorId: 'soulmark-297-transform',
  //   buildDescriptor() {
  //     return {
  //       id: 'soulmark-297-transform',
  //       source: '专属特性',
  //       scope: 'base_inbattle',
  //       priority: 0,
  //       description:
  //         '在战斗中，攻击和特攻等于其中较高的一项（所属精灵：天尊·白虎）',
  //       transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
  //     };
  //   },
  // });

  // defaultBonusRegistry.registerSoulmarkTransform({
  //   effectId: 677,
  //   descriptorId: 'soulmark-677-transform',
  //   buildDescriptor() {
  //     return {
  //       id: 'soulmark-677-transform',
  //       source: '专属特性',
  //       scope: 'base_inbattle',
  //       priority: 0,
  //       description:
  //         '在战斗中，攻击和特攻等于其中较高的一项（所属精灵：烈焰之主·炽焰金刚）',
  //       transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
  //     };
  //   },
  // });

  // defaultBonusRegistry.registerSoulmarkTransform({
  //   effectId: 912,
  //   descriptorId: 'soulmark-912-transform',
  //   buildDescriptor() {
  //     return {
  //       id: 'soulmark-912-transform',
  //       source: '专属特性',
  //       scope: 'base_inbattle',
  //       priority: 0,
  //       description:
  //         '在战斗中，攻击和特攻等于其中较高的一项（所属精灵：圣尊啸傲·白虎）',
  //       transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
  //     };
  //   },
  // });

  // defaultBonusRegistry.registerSoulmarkTransform({
  //   effectId: 1236,
  //   descriptorId: 'soulmark-1236-transform',
  //   buildDescriptor() {
  //     return {
  //       id: 'soulmark-1236-transform',
  //       source: '专属特性',
  //       scope: 'pvp_inbattle',
  //       priority: 0,
  //       description:
  //         '在战斗中，攻击和特攻等于其中较高的一项（所属精灵：天启星魂）',
  //       transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
  //     };
  //   },
  // });

  // defaultBonusRegistry.registerSoulmarkTransform({
  //   effectId: 1477,
  //   descriptorId: 'soulmark-1477-transform',
  //   buildDescriptor() {
  //     return {
  //       id: 'soulmark-1477-transform',
  //       source: '专属特性',
  //       scope: 'pvp_inbattle',
  //       priority: 0,
  //       description:
  //         '在战斗中，攻击和特攻等于其中较高的一项（所属精灵：未来·小火猴）',
  //       transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
  //     };
  //   },
  // });

  // defaultBonusRegistry.registerSoulmarkTransform({
  //   effectId: 1886,
  //   descriptorId: 'soulmark-1886-transform',
  //   buildDescriptor() {
  //     return {
  //       id: 'soulmark-1886-transform',
  //       source: '专属特性',
  //       scope: 'pvp_inbattle',
  //       priority: 0,
  //       description: '在战斗中，攻击和特攻等于其中较高的一项',
  //       transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
  //     };
  //   },
  // });

  // defaultBonusRegistry.registerSoulmarkTransform({
  //   effectId: 2237,
  //   descriptorId: 'soulmark-2237-transform',
  //   buildDescriptor() {
  //     return {
  //       id: 'soulmark-2237-transform',
  //       source: '专属特性',
  //       scope: 'base_inbattle',
  //       priority: 0,
  //       description: '在战斗中，攻击和特攻等于其中较高的一项',
  //       transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
  //     };
  //   },
  // });

  defaultBonusRegistry.registerSoulmarkTransform({
    effectId: 2037,
    descriptorId: 'soulmark-2037-transform',
    buildDescriptor() {
      return {
        id: 'soulmark-2037-transform',
        source: '专属特性',
        scope: 'pvp_inbattle',
        priority: 0,
        description:
          '在战斗中自身速度值等于攻击值和特攻值中较高的一项（所属精灵：幽火·海登）',
        transform: {
          kind: 'sync_to_higher_of',
          sources: ['atk', 'spAtk'],
          targets: ['spd'],
        },
      };
    },
  });

  defaultBonusRegistry.registerSoulmarkTransform({
    effectId: 2107,
    descriptorId: 'soulmark-2107-transform',
    buildDescriptor() {
      return {
        id: 'soulmark-2107-transform',
        source: '专属特性',
        scope: 'pvp_inbattle',
        priority: 0,
        description:
          '自身在场期间防御、特防值等于攻击、特攻值中较低的一项（所属精灵：卫岳）',
        transform: {
          kind: 'sync_to_lower_of',
          sources: ['atk', 'spAtk'],
          targets: ['def', 'spDef'],
        },
      };
    },
  });
}
