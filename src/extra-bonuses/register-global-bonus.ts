import type { AttrItemName, BonusScope } from '../types.js';
import type { AttributeDelta, BonusDescriptor } from './types.js';
import type { BonusRegistry } from './registry.js';

interface GlobalBonusBaseOptions {
  readonly bonusId: string;
  readonly source: AttrItemName;
  readonly description: string;
  readonly scope?: BonusScope;
  readonly priority?: number;
}

export interface RegisterGlobalFixedBonusOptions extends GlobalBonusBaseOptions {
  readonly value: AttributeDelta;
}

export interface RegisterGlobalPickNBonusOptions extends GlobalBonusBaseOptions {
  readonly options: ReadonlyArray<AttributeDelta>;
  readonly pickCount: number;
  readonly repeatable?: boolean;
}

function toDescriptor(
  options: GlobalBonusBaseOptions,
  mechanism: BonusDescriptor['mechanism'],
): BonusDescriptor {
  return {
    id: options.bonusId,
    source: options.source,
    scope: options.scope ?? 'all',
    priority: options.priority ?? 0,
    description: options.description,
    mechanism,
  };
}

/** 注册全员固定数值加成（如战队科技满级 +X） */
export function registerGlobalFixedBonus(
  registry: BonusRegistry,
  options: RegisterGlobalFixedBonusOptions,
): void {
  registry.registerGlobalBonus({
    descriptor: toDescriptor(options, {
      kind: 'fixed',
      value: options.value,
    }),
  });
}

/** 注册全员多选 n 加成 */
export function registerGlobalPickNBonus(
  registry: BonusRegistry,
  options: RegisterGlobalPickNBonusOptions,
): void {
  registry.registerGlobalBonus({
    descriptor: toDescriptor(options, {
      kind: 'pick_n',
      options: options.options,
      pickCount: options.pickCount,
      repeatable: options.repeatable,
    }),
  });
}
