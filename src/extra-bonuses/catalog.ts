import type { PetAttrCalcOptions } from '../types.js';
import { defaultBonusRegistry } from './registry.js';
import { partitionDescriptorsByMechanism } from './resolve.js';
import type {
  BonusDescriptor,
  BonusSelection,
  BonusSelectionEntry,
  PetBonusContext,
} from './types.js';
import type { TransformDescriptor } from './transforms/types.js';

/**
 * 当前精灵在指定上下文下「可配置」的加成目录。
 *
 * 典型调用链：
 * 1. {@link listAvailableBonuses} — 列出 UI 应展示的条目
 * 2. 用户勾选/填写后，组装 {@link BonusSelectionEntry}[]
 * 3. 传入 {@link calcPetAttr} 的 `bonusSelections`
 *
 * 注意：目录中的条目**不会自动生效**；未写入 `bonusSelections` 的 id 一律忽略。
 * `transforms` 是例外：装备魂印后由引擎自动应用，无需也不应写入 `bonusSelections`。
 */
export interface AvailableBonuses {
  /**
   * 全部可选加成（global / 精灵专属 / 魂印），与 `static` ∪ `transfer` 相同。
   * 渲染 UI 时通常遍历此字段；每项的 `mechanism` 决定控件形态（开关 / 多选 / 加点池等）。
   */
  readonly selectable: readonly BonusDescriptor[];

  /**
   * 静态机制加成（fixed / pick_n / pool）。
   * 解析时走 {@link resolveBonuses}，不依赖已算好的基础面板。
   */
  readonly static: readonly BonusDescriptor[];

  /**
   * 来源搬运机制加成（transfer_sources，如飞王的「所有对于速度的强化同时应用于体力（刻印，学习力）」）。
   * 解析时走 {@link resolveTransferBonuses}，需读取基础面板中的来源明细。
   * 一般 UI 仍展示在 `selectable` 中；此字段供需要分区处理的调用方使用。
   */
  readonly transfer: readonly BonusDescriptor[];

  /**
   * 魂印属性变换（如战斗中攻击特攻取较高值）。
   * 装备对应魂印后自动生效；仅用于展示说明，**不要**加入 `bonusSelections`。
   */
  readonly transforms: readonly TransformDescriptor[];
}

/**
 * 从 `calcPetAttr` 入参中提取 registry lookup 所需的上下文。
 *
 * 多数场景直接使用 {@link listAvailableBonuses} 即可；仅在自定义 registry 逻辑
 * 或需要与 `BonusRegistry.lookup` 手动对接时才单独调用。
 */
export function buildBonusContext(
  options: Pick<PetAttrCalcOptions, 'id' | 'level' | 'soulmark'>,
): PetBonusContext {
  return {
    petId: options.id,
    level: options.level,
    soulmark: options.soulmark,
  };
}

/**
 * 列出当前精灵可用的加成目录，供 UI 发现选项并构建 `bonusSelections`。
 *
 * @param options - 至少提供 `id`、`level`；有魂印时传入 `soulmark` 以命中魂印加成与变换。
 *   未传 `bonusRegistry` 时使用内置 {@link defaultBonusRegistry}。
 *
 * @example
 * ```ts
 * const available = listAvailableBonuses({ id: petId, level: 100, soulmark });
 *
 * // 展示可选加成
 * for (const d of available.selectable) {
 *   console.log(d.id, d.description, d.mechanism.kind);
 * }
 *
 * // 用户启用 fixed 加成后
 * const bonusSelections = [
 *   defaultSelectionEntryFor(available.selectable.find((d) => d.id === 'team')!),
 * ];
 * calcPetAttr({ ...opts, bonusSelections, extraBonuses: [] });
 * ```
 */
export function listAvailableBonuses(
  options: Pick<
    PetAttrCalcOptions,
    'id' | 'level' | 'soulmark' | 'bonusRegistry'
  >,
): AvailableBonuses {
  const context = buildBonusContext(options);
  const registry = options.bonusRegistry ?? defaultBonusRegistry;
  const selectable = registry.lookup(context);
  const { static: staticDescriptors, transfer: transferDescriptors } =
    partitionDescriptorsByMechanism(selectable);
  const transforms = registry.lookupTransforms(context);

  return {
    selectable,
    static: staticDescriptors,
    transfer: transferDescriptors,
    transforms,
  };
}

/**
 * 根据 descriptor 的 `mechanism.kind` 生成对应的空选择值，供 UI 初始化控件。
 *
 * 返回值**不代表已启用**；用户确认后仍需将条目加入 `bonusSelections` 才会参与计算。
 *
 * | mechanism          | 返回值含义 |
 * | ------------------ | ---------- |
 * | `fixed`            | 无额外参数，勾选即可 |
 * | `transfer_sources` | 无额外参数，勾选即可 |
 * | `pick_n`           | 空选；提交前须填够 `pickCount` 个下标 |
 * | `pool`             | 全 0 分配；提交前须填写 `allocation` 字段 |
 */
export function defaultSelectionFor(
  descriptor: BonusDescriptor,
): BonusSelection {
  switch (descriptor.mechanism.kind) {
    case 'fixed':
      return { kind: 'fixed' };
    case 'transfer_sources':
      return { kind: 'transfer_sources' };
    case 'pick_n':
      return { kind: 'pick_n', selectedIndices: [] };
    case 'pool':
      return { kind: 'pool', allocation: {} };
    default: {
      const _exhaustive = descriptor.mechanism;
      throw new Error(
        `未知加成机制：${(_exhaustive as { kind: string }).kind}`,
      );
    }
  }
}

/**
 * 将 descriptor 与其默认选择打包为 {@link BonusSelectionEntry}。
 *
 * 等价于 `{ id: descriptor.id, selection: defaultSelectionFor(descriptor) }`。
 * 用户修改 pick_n / pool 等字段后，保留 `id` 并替换 `selection` 再传入 `calcPetAttr`。
 */
export function defaultSelectionEntryFor(
  descriptor: BonusDescriptor,
): BonusSelectionEntry {
  return {
    id: descriptor.id,
    selection: defaultSelectionFor(descriptor),
  };
}
