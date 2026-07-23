import type {
  ExtraBonus,
  PercentSixAttributes,
  SingleAttr,
  SixAttributes,
} from '../types.js';
import {
  clearSourceSlot,
  computeTransferAmount,
} from './derive/source-transfer.js';
import { resolveFixed } from './mechanisms/fixed.js';
import { resolvePickN } from './mechanisms/pick-n.js';
import { resolvePool } from './mechanisms/pool.js';
import type {
  AttributeDelta,
  BonusDescriptor,
  BonusSelection,
  BonusSelectionEntry,
} from './types.js';

const SIX_ATTR_KEYS = [
  'atk',
  'def',
  'spAtk',
  'spDef',
  'spd',
  'hp',
] as const satisfies readonly (keyof SixAttributes)[];

const PERCENT_ATTR_KEYS = [
  'atkPercent',
  'defPercent',
  'spAtkPercent',
  'spDefPercent',
  'spdPercent',
  'hpPercent',
] as const satisfies readonly (keyof PercentSixAttributes)[];

function emptySixAttributes(): SixAttributes {
  return { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, hp: 0 };
}

function emptyPercentSixAttributes(): PercentSixAttributes {
  return {
    atkPercent: 0,
    defPercent: 0,
    spAtkPercent: 0,
    spDefPercent: 0,
    spdPercent: 0,
    hpPercent: 0,
  };
}

/**
 * 将稀疏属性增量补全为六项固定值与六项百分比（未出现的项填 0）。
 * 供计算引擎消费统一的 `ExtraBonus.value` 结构。
 */
export function normalizeDelta(
  delta: AttributeDelta,
): SixAttributes & PercentSixAttributes {
  const flat = emptySixAttributes();
  const percent = emptyPercentSixAttributes();

  for (const key of SIX_ATTR_KEYS) {
    flat[key] = delta[key] ?? 0;
  }
  for (const key of PERCENT_ATTR_KEYS) {
    percent[key] = delta[key] ?? 0;
  }

  return { ...flat, ...percent };
}

function assertSelectionKind(
  mechanismKind: BonusDescriptor['mechanism']['kind'],
  selectionKind: BonusSelection['kind'],
  bonusId: string,
): void {
  if (mechanismKind !== selectionKind) {
    throw new Error(
      `加成 ${bonusId}：机制为 ${mechanismKind}，选择为 ${selectionKind}`,
    );
  }
}

/**
 * 按机制类型解析玩家选择，产出属性增量。
 *
 * @param bonusId 用于校验失败时的错误信息定位
 * @throws 机制与选择类型不匹配，或 pick_n / pool 校验不通过时
 */
export function resolveMechanism(
  mechanism: BonusDescriptor['mechanism'],
  selection: BonusSelection,
  bonusId: string,
): AttributeDelta {
  switch (mechanism.kind) {
    case 'fixed':
      assertSelectionKind('fixed', selection.kind, bonusId);
      return resolveFixed(mechanism);
    case 'pick_n': {
      assertSelectionKind('pick_n', selection.kind, bonusId);
      if (selection.kind !== 'pick_n') {
        throw new Error(`加成 ${bonusId}：选择类型不匹配`);
      }
      return resolvePickN(mechanism, selection, bonusId);
    }
    case 'pool': {
      assertSelectionKind('pool', selection.kind, bonusId);
      if (selection.kind !== 'pool') {
        throw new Error(`加成 ${bonusId}：选择类型不匹配`);
      }
      return resolvePool(mechanism, selection, bonusId);
    }
    case 'transfer_sources':
      throw new Error(
        `加成 ${bonusId}：transfer_sources 须通过 resolveTransferBonuses 解析`,
      );
    default: {
      const _exhaustive: never = mechanism;
      throw new Error(
        `未知加成机制：${(_exhaustive as { kind: string }).kind}`,
      );
    }
  }
}

/**
 * 将单条加成描述与玩家选择解析为计算引擎可用的 `ExtraBonus`。
 */
export function resolveBonus(
  descriptor: BonusDescriptor,
  selection: BonusSelection,
): ExtraBonus {
  const delta = resolveMechanism(
    descriptor.mechanism,
    selection,
    descriptor.id,
  );
  return {
    scope: descriptor.scope,
    priority: descriptor.priority,
    description: descriptor.description,
    source: descriptor.source,
    value: normalizeDelta(delta),
  };
}

/**
 * 将单条来源搬运加成解析为 ExtraBonus（依赖已含学习力/刻印明细的 baseAttrs）。
 */
export function resolveTransferBonus(
  descriptor: BonusDescriptor,
  selection: BonusSelection,
  baseAttrs: Record<keyof SixAttributes, SingleAttr>,
): ExtraBonus {
  assertSelectionKind('transfer_sources', selection.kind, descriptor.id);
  if (descriptor.mechanism.kind !== 'transfer_sources') {
    throw new Error(`加成 ${descriptor.id}：机制不是 transfer_sources`);
  }
  const { spec } = descriptor.mechanism;
  if (spec.mode === 'overwrite') {
    clearSourceSlot(baseAttrs, spec);
  }
  const amount = computeTransferAmount(baseAttrs, spec);
  return {
    scope: descriptor.scope,
    priority: descriptor.priority,
    description: descriptor.description,
    source: spec.asSource,
    value: normalizeDelta({ [spec.toStat]: amount }),
  };
}

/**
 * 按机制类型拆分描述：静态机制 vs 需读取 baseAttrs 的来源搬运。
 */
export function partitionDescriptorsByMechanism(
  descriptors: readonly BonusDescriptor[],
): {
  static: BonusDescriptor[];
  transfer: BonusDescriptor[];
} {
  const staticDescriptors: BonusDescriptor[] = [];
  const transferDescriptors: BonusDescriptor[] = [];
  for (const descriptor of descriptors) {
    if (descriptor.mechanism.kind === 'transfer_sources') {
      transferDescriptors.push(descriptor);
    } else {
      staticDescriptors.push(descriptor);
    }
  }
  return { static: staticDescriptors, transfer: transferDescriptors };
}

/**
 * 批量解析来源搬运加成。
 *
 * @throws selection 中的 id 不在 descriptors 中时
 */
export function resolveTransferBonuses(
  descriptors: readonly BonusDescriptor[],
  selections: readonly BonusSelectionEntry[],
  baseAttrs: Record<keyof SixAttributes, SingleAttr>,
): ExtraBonus[] {
  const descriptorById = new Map(
    descriptors.map((descriptor) => [descriptor.id, descriptor]),
  );

  return selections.flatMap((entry) => {
    const descriptor = descriptorById.get(entry.id);
    if (descriptor === undefined) {
      return [];
    }
    return [resolveTransferBonus(descriptor, entry.selection, baseAttrs)];
  });
}

/**
 * 批量解析加成：仅解析 `selections` 中玩家启用的条目。
 *
 * @throws selection 中的 id 不在 descriptors（lookup 结果）中时
 */
export function resolveBonuses(
  descriptors: readonly BonusDescriptor[],
  selections: readonly BonusSelectionEntry[],
): ExtraBonus[] {
  const descriptorById = new Map(
    descriptors.map((descriptor) => [descriptor.id, descriptor]),
  );

  return selections.map((entry) => {
    const descriptor = descriptorById.get(entry.id);
    if (descriptor === undefined) {
      throw new Error(`加成 ${entry.id}：不在当前精灵可用加成列表中`);
    }
    return resolveBonus(descriptor, entry.selection);
  });
}
