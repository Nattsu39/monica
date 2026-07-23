import { defaultBonusRegistry } from '../registry.js';
import { registerGlobalFixedBonus } from '../register-global-bonus.js';
import {
  registerSoulmarkBonuses,
  registerSoulmarkTransforms,
} from './soulmark.js';

export const EXTRA_HP_VALUE = 20;
/** 向 defaultBonusRegistry 注册加成数据 */
export function registerDefaultBonuses(): void {
  defaultBonusRegistry.registerGlobalBonus({
    descriptor: {
      id: 'team',
      source: '战队加成',
      scope: 'base',
      priority: 0,
      description: '战队加成',
      mechanism: {
        kind: 'pool',
        total: Infinity,
        bounds: {
          atk: { min: 0, max: 15 },
          def: { min: 0, max: 15 },
          hp: { min: 0, max: 30 },
          spAtk: { min: 0, max: 15 },
          spDef: { min: 0, max: 15 },
          spd: { min: 0, max: 10 },
        },
      },
    },
  });

  defaultBonusRegistry.registerGlobalBonus({
    descriptor: {
      id: 'extra-hp',
      source: '额外体力上限',
      scope: 'base',
      priority: 0,
      description: '额外体力上限，使用体力合剂提升',
      mechanism: {
        kind: 'pool',
        total: Infinity,
        bounds: {
          atk: { min: 0, max: 0 },
          def: { min: 0, max: 0 },
          hp: { min: 0, max: EXTRA_HP_VALUE },
          spAtk: { min: 0, max: 0 },
          spDef: { min: 0, max: 0 },
          spd: { min: 0, max: 0 },
        },
      },
    },
  });

  registerGlobalFixedBonus(defaultBonusRegistry, {
    bonusId: 'vip-year',
    source: '年费加成',
    description: '年费加成全属性+10',
    value: { atk: 10, def: 10, hp: 10, spAtk: 10, spDef: 10, spd: 10 },
  });
}

registerDefaultBonuses();
registerSoulmarkBonuses();
registerSoulmarkTransforms();
