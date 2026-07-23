import type {
  AttrItemName,
  MintmarkAttr,
  PercentSixAttributes,
  SingleAttr,
  SixAttributes,
} from '../../types.js';

/** 跨属性来源搬运配置 */
export interface SourceTransferSpec {
  /** 读取来源的属性 */
  fromStat: keyof SixAttributes;
  /** 要搬运的明细来源名；如 ['学习力', '刻印'] */
  sourceNames: readonly AttrItemName[];
  /** 写入目标属性 */
  toStat: keyof SixAttributes;
  /** 写入时使用的来源标签，如 '专属特性' */
  asSource: AttrItemName;
  /**
   * additive: 与目标已有同 asSource 明细累加
   * overwrite: 覆写目标 asSource 明细
   */
  mode: 'additive' | 'overwrite';
}

function getNatureModifier(
  natureBonus: PercentSixAttributes,
  stat: keyof SixAttributes,
): number {
  const key = `${stat}Percent` as keyof PercentSixAttributes;
  return natureBonus[key] ?? 1;
}

/**
 * 从 level/evs/性格修正直接计算学习力明细值（与 calcBaseSixAttributes 写入 details 一致）。
 * 供单元测试或无 baseAttrs 场景复用。
 */
export function computeEvDetailValue(
  stat: keyof SixAttributes,
  level: number,
  evs: SixAttributes,
  natureBonus: PercentSixAttributes,
): number {
  const evStat = evs[stat] / 4;
  if (stat === 'hp') {
    return evStat * (level / 100);
  }
  return evStat * (level / 100) * getNatureModifier(natureBonus, stat);
}

/** 汇总刻印数组在指定属性上的固定值贡献 */
export function computeMintmarkDetailSum(
  stat: keyof SixAttributes,
  mintmarks: readonly MintmarkAttr[],
): number {
  let sum = 0;
  for (const mintmark of mintmarks) {
    sum += mintmark[stat];
  }
  return sum;
}

/** 从已构建的 baseAttrs 明细中汇总搬运量 */
export function computeTransferAmount(
  baseAttrs: Record<keyof SixAttributes, SingleAttr>,
  spec: SourceTransferSpec,
): number {
  const sourceSet = new Set<AttrItemName>(spec.sourceNames);
  return baseAttrs[spec.fromStat].details
    .filter((detail) => sourceSet.has(detail.name))
    .reduce((sum, detail) => sum + detail.value, 0);
}

/**
 * 从目标属性中移除 asSource 明细并回退其对面板值的贡献。
 * 用于 replace_slot 模式。
 */
export function clearSourceSlot(
  baseAttrs: Record<keyof SixAttributes, SingleAttr>,
  spec: SourceTransferSpec,
): void {
  const target = baseAttrs[spec.toStat];
  let removedSum = 0;
  const kept = target.details.filter((detail) => {
    if (detail.name !== spec.asSource) {
      return true;
    }
    removedSum += detail.value;
    return false;
  });
  target.details = kept;
  target.value -= removedSum;
}
