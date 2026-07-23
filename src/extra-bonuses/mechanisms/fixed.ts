import type { AttributeDelta } from '../types.js';

/** 解析固定数值机制：直接返回预设的属性增量。 */
export function resolveFixed(mechanism: {
  kind: 'fixed';
  value: AttributeDelta;
}): AttributeDelta {
  return { ...mechanism.value };
}
