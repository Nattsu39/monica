import type {
  PetAttrCalcResult,
  SingleAttr,
  SixAttributes,
} from '../../types.js';
import { getScopeTargets } from '../../attr-scopes.js';
import type { TransformDescriptor } from './types.js';

const SIX_ATTR_KEYS = [
  'atk',
  'def',
  'spAtk',
  'spDef',
  'spd',
  'hp',
] as const satisfies readonly (keyof SixAttributes)[];

function applySyncToMax(
  target: Record<keyof SixAttributes, SingleAttr>,
  stats: readonly (keyof SixAttributes)[],
  descriptor: TransformDescriptor,
): void {
  const maxVal = Math.max(...stats.map((key) => target[key].value));
  for (const key of stats) {
    const prev = target[key].value;
    if (prev === maxVal) {
      continue;
    }
    target[key].value = maxVal;
    target[key].details.push({
      name: descriptor.source,
      value: maxVal - prev,
      description: descriptor.description,
    });
  }
}

function applySyncToHigherOf(
  target: Record<keyof SixAttributes, SingleAttr>,
  targetAttrKey: readonly (keyof SixAttributes)[],
  sources: readonly (keyof SixAttributes)[],
  descriptor: TransformDescriptor,
): void {
  const higherOf = getHigherOf(sources, target);
  for (const key of targetAttrKey) {
    const prev = target[key].value;
    if (prev === higherOf) {
      continue;
    }
    target[key].value = higherOf;
    target[key].details.push({
      name: descriptor.source,
      value: higherOf - prev,
      description: descriptor.description,
    });
  }
}

function applySyncToLowerOf(
  target: Record<keyof SixAttributes, SingleAttr>,
  targetAttrKey: readonly (keyof SixAttributes)[],
  sources: readonly (keyof SixAttributes)[],
  descriptor: TransformDescriptor,
): void {
  const lowerOf = getLowerOf(sources, target);
  for (const key of targetAttrKey) {
    const prev = target[key].value;
    if (prev === lowerOf) {
      continue;
    }
    target[key].value = lowerOf;
    target[key].details.push({
      name: descriptor.source,
      value: lowerOf - prev,
      description: descriptor.description,
    });
  }
}

function getHigherOf(
  sources: readonly (keyof SixAttributes)[],
  values: Record<keyof SixAttributes, SingleAttr>,
): number {
  return sources.reduce(
    (max, source) => Math.max(max, values[source].value),
    0,
  );
}

function getLowerOf(
  sources: readonly (keyof SixAttributes)[],
  values: Record<keyof SixAttributes, SingleAttr>,
): number {
  return Math.min(...sources.map((key) => values[key].value));
}

function applyTransform(
  target: Record<keyof SixAttributes, SingleAttr>,
  descriptor: TransformDescriptor,
): void {
  const { transform } = descriptor;
  switch (transform.kind) {
    case 'sync_to_max':
      applySyncToMax(target, transform.stats, descriptor);
      break;
    case 'sync_to_higher_of':
      applySyncToHigherOf(
        target,
        transform.targets,
        transform.sources,
        descriptor,
      );
      break;
    case 'sync_to_lower_of':
      applySyncToLowerOf(
        target,
        transform.targets,
        transform.sources,
        descriptor,
      );
      break;
  }
}

/** 按 priority 与 scope 将属性变换应用到结果各桶 */
export function applyTransforms(
  result: PetAttrCalcResult,
  descriptors: readonly TransformDescriptor[],
): void {
  const sorted = [...descriptors].sort((a, b) => a.priority - b.priority);
  for (const descriptor of sorted) {
    for (const target of getScopeTargets(descriptor.scope, result)) {
      applyTransform(target, descriptor);
    }
  }
}

/** 深拷贝单项能力记录 */
export function deepCloneSingleAttr(attr: SingleAttr): SingleAttr {
  return {
    value: attr.value,
    details: attr.details.map((detail) => ({ ...detail })),
  };
}

/** 深拷贝六项能力记录 */
export function deepCloneSingleAttrRecord(
  attrs: Record<keyof SixAttributes, SingleAttr>,
): Record<keyof SixAttributes, SingleAttr> {
  return Object.fromEntries(
    SIX_ATTR_KEYS.map((key) => [key, deepCloneSingleAttr(attrs[key])]),
  ) as Record<keyof SixAttributes, SingleAttr>;
}
