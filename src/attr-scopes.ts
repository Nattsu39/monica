import type {
  AttrMode,
  BonusScope,
  PetAttrCalcResult,
  SingleAttr,
  SixAttributes,
} from './types.js';
import { deepCloneSingleAttrRecord } from './extra-bonuses/transforms/apply.js';

export const ATTR_MODES = [
  'base',
  'pve',
  'pvp',
] as const satisfies readonly AttrMode[];

const IN_BATTLE_SCOPES = new Set<BonusScope>([
  'base_inbattle',
  'pve_inbattle',
  'pvp_inbattle',
]);

/** 将 BonusScope 解析为 PetAttrCalcResult 中的目标能力桶 */
export function getScopeTargets(
  scope: BonusScope,
  result: PetAttrCalcResult,
): Record<keyof SixAttributes, SingleAttr>[] {
  switch (scope) {
    case 'all':
      return [result.base, result.pve, result.pvp];
    case 'base':
      return [result.base];
    case 'pve':
      return [result.pve];
    case 'pvp':
      return [result.pvp];
    case 'base_inbattle':
      return [result.base_inbattle];
    case 'pve_inbattle':
      return [result.pve_inbattle];
    case 'pvp_inbattle':
      return [result.pvp_inbattle];
    default: {
      const _exhaustive: never = scope;
      throw new Error(`未知作用域：${_exhaustive}`);
    }
  }
}

export function isInBattleScope(scope: BonusScope): boolean {
  return IN_BATTLE_SCOPES.has(scope);
}

/** 将三个面板桶克隆到对应的战斗桶 */
export function cloneInBattleBuckets(result: PetAttrCalcResult): void {
  for (const mode of ATTR_MODES) {
    const inBattleKey = `${mode}_inbattle` as `${AttrMode}_inbattle`;
    result[inBattleKey] = deepCloneSingleAttrRecord(result[mode]);
  }
}
