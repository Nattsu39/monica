import type { SixAttributes } from '../../types.js';
import type { AttributeDelta, BonusSelection } from '../types.js';

const SIX_ATTR_KEYS = [
  'atk',
  'def',
  'spAtk',
  'spDef',
  'spd',
  'hp',
] as const satisfies readonly (keyof SixAttributes)[];

/**
 * 解析加点池机制：校验分配总量与单项上下限后返回六项分配值。
 *
 * @throws 分配值无效、超出 bounds，或总和与 total 不一致时
 */
export function resolvePool(
  mechanism: {
    kind: 'pool';
    total: number;
    bounds?: Partial<Record<keyof SixAttributes, { min: number; max: number }>>;
  },
  selection: Extract<BonusSelection, { kind: 'pool' }>,
  bonusId: string,
): AttributeDelta {
  const { allocation } = selection;
  const { total, bounds = {} } = mechanism;

  let sum = 0;
  const result: Partial<SixAttributes> = {};

  for (const key of SIX_ATTR_KEYS) {
    const value = allocation[key] ?? 0;
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`加成 ${bonusId}：pool 属性 ${key} 分配值无效`);
    }
    const bound = bounds[key];
    if (bound !== undefined) {
      if (value < bound.min || value > bound.max) {
        throw new Error(
          `加成 ${bonusId}：pool 属性 ${key} 分配 ${value} 超出范围 [${bound.min}, ${bound.max}]`,
        );
      }
    }
    result[key] = value;
    sum += value;
  }

  if (sum !== total) {
    throw new Error(
      `加成 ${bonusId}：pool 分配总和 ${sum} 与总量 ${total} 不一致`,
    );
  }

  return result;
}
