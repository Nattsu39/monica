import type { AttributeDelta } from '../types.js';
import type { BonusSelection } from '../types.js';

function mergeDelta(
  target: AttributeDelta,
  source: AttributeDelta,
): AttributeDelta {
  const result: AttributeDelta = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const k = key as keyof AttributeDelta;
    const prev = result[k] ?? 0;
    result[k] = prev + (value as number);
  }
  return result;
}

/**
 * 解析多选 n 机制：将玩家选中的选项增量逐项累加。
 *
 * @throws 选项数量不符、下标越界，或不可重复时选了相同选项
 */
export function resolvePickN(
  mechanism: {
    kind: 'pick_n';
    options: ReadonlyArray<AttributeDelta>;
    pickCount: number;
    repeatable?: boolean;
  },
  selection: Extract<BonusSelection, { kind: 'pick_n' }>,
  bonusId: string,
): AttributeDelta {
  const { selectedIndices } = selection;
  const { options, pickCount, repeatable = false } = mechanism;

  if (selectedIndices.length !== pickCount) {
    throw new Error(
      `加成 ${bonusId}：pick_n 需选择 ${pickCount} 项，实际 ${selectedIndices.length} 项`,
    );
  }

  if (!repeatable) {
    const unique = new Set(selectedIndices);
    if (unique.size !== selectedIndices.length) {
      throw new Error(`加成 ${bonusId}：pick_n 不允许重复选择同一选项`);
    }
  }

  let result: AttributeDelta = {};
  for (const index of selectedIndices) {
    if (!Number.isInteger(index) || index < 0 || index >= options.length) {
      throw new Error(
        `加成 ${bonusId}：pick_n 选项下标 ${index} 越界（共 ${options.length} 项）`,
      );
    }
    result = mergeDelta(result, options[index]);
  }
  return result;
}
