import type { AttrItemName, BonusScope, SixAttributes } from '../../types.js';

/** 属性变换：重写已计算的能力值，不产生独立增量 */
export type StatTransform =
  /** 所列属性均设为它们之中的最大值 */
  | { kind: 'sync_to_max'; stats: readonly (keyof SixAttributes)[] }
  /** 所列targets属性均设置为属性列表sources之中较高的一项 */
  | {
      kind: 'sync_to_higher_of';
      sources: readonly (keyof SixAttributes)[];
      targets: readonly (keyof SixAttributes)[];
    }
  /** 所列targets属性均设置为属性列表sources之中较低的一项 */
  | {
      kind: 'sync_to_lower_of';
      sources: readonly (keyof SixAttributes)[];
      targets: readonly (keyof SixAttributes)[];
    };

export interface TransformDescriptor {
  id: string;
  source: AttrItemName;
  scope: BonusScope;
  priority: number;
  description: string;
  transform: StatTransform;
}
