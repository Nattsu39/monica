import type { SourceTransferSpec } from './derive/source-transfer.js';
import type { Soulmark } from '../types.js';
import type {
  AttrItemName,
  BonusScope,
  PercentSixAttributes,
  SixAttributes,
} from '../types.js';

export type { SourceTransferSpec };

/** 单项属性增量（固定值或百分比，未出现的项视为 0） */
export type AttributeDelta = Partial<SixAttributes & PercentSixAttributes>;

/** 加成机制：四种模式的判别联合 */
export type BonusMechanism =
  /** 固定数值：直接按预设增量加成，无需玩家额外选择 */
  | { kind: 'fixed'; value: AttributeDelta }
  | {
      kind: 'pick_n';
      /** 可选项列表，每项为一组属性增量 */
      options: ReadonlyArray<AttributeDelta>;
      /** 必须选择的选项数量 */
      pickCount: number;
      /** 同一选项可否重复选取，默认 false */
      repeatable?: boolean;
    }
  | {
      kind: 'pool';
      /** 可分配的总点数 */
      total: number;
      /** 各属性的分配上下限，未声明的项默认仅校验非负 */
      bounds?: Partial<
        Record<keyof SixAttributes, { min: number; max: number }>
      >;
    }
  | {
      kind: 'transfer_sources';
      spec: SourceTransferSpec;
    };

/** 注册表 lookup 产出的「可用加成」描述；`id` 即 `bonusSelections` 中引用的键 */
export interface BonusDescriptor {
  id: string;
  source: AttrItemName;
  scope: BonusScope;
  priority: number;
  description: string;
  mechanism: BonusMechanism;
}

/**
 * 玩家对某项加成的具体选择。
 * `kind` 必须与对应 {@link BonusDescriptor.mechanism} 的 `kind` 一致。
 */
export type BonusSelection =
  /** 固定数值机制：无需额外参数 */
  | { kind: 'fixed' }
  /** 多选 n 机制：`selectedIndices` 为 `options` 的下标列表 */
  | { kind: 'pick_n'; selectedIndices: readonly number[] }
  /** 加点池机制：`allocation` 为六项属性的分配值 */
  | { kind: 'pool'; allocation: Partial<SixAttributes> }
  /** 来源搬运机制：无需额外参数 */
  | { kind: 'transfer_sources' };

/**
 * 传入 {@link calcPetAttr} 的 `bonusSelections` 的单项。
 * 通过 `id` 与 {@link listAvailableBonuses} 返回的 descriptor 配对；仅列表中的 id 会被解析。
 */
export interface BonusSelectionEntry {
  id: string;
  selection: BonusSelection;
}

/** registry lookup 上下文：`petId` 对应 `PetAttrCalcOptions.id` */
export interface PetBonusContext {
  petId: number;
  level: number;
  soulmark?: Soulmark;
}
