import type { BonusSelectionEntry } from './extra-bonuses/types.js';
import type { TransformDescriptor } from './extra-bonuses/transforms/types.js';
import type { BonusRegistry } from './extra-bonuses/registry.js';

export interface SixAttributes {
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  spd: number;
  hp: number;
}

export type PercentSixAttributes = Record<
  `${keyof SixAttributes}Percent`,
  number
>;

type AtMost3<T> = [] | [T] | [T, T] | [T, T, T];

export type MintmarkAttr = SixAttributes;

export interface ExtraBonus {
  scope: BonusScope;
  value: SixAttributes & PercentSixAttributes;
  priority: number;
  description?: string;
  source?: AttrItemName;
}

export type AttrMode = 'base' | 'pve' | 'pvp';
export type AttrBucket = AttrMode | `${AttrMode}_inbattle`;

export type BonusScope = AttrMode | `${AttrMode}_inbattle` | 'all';

export interface PetAttrCalcOptions {
  id: number;
  level: number;
  baseStats: SixAttributes;
  awakenBaseStats?: SixAttributes;
  iv: number;
  natureBonus: PercentSixAttributes;
  evs: SixAttributes;
  mintmarks: AtMost3<MintmarkAttr>;
  soulmark?: Soulmark;
  bonusRegistry?: BonusRegistry;
  bonusSelections: BonusSelectionEntry[];
  extraBonuses: ExtraBonus[];
  externalTransforms?: readonly TransformDescriptor[];
}

export type AttrItemName =
  | '学习力'
  | '刻印'
  | '战队加成'
  | '称号加成'
  | '年费加成'
  | '道具加成'
  | '专属特性'
  | '装扮加成'
  | '超能加成'
  | '神谕觉醒'
  | '特殊加成'
  | '基础值加成';

export interface AttrDetail {
  name: AttrItemName;
  percent?: number;
  value: number;
  description: string;
}

export interface SingleAttr {
  value: number;
  details: AttrDetail[];
}

export interface PetAttrCalcResult
  extends
    Record<AttrMode, Record<keyof SixAttributes, SingleAttr>>,
    Record<`${AttrMode}_inbattle`, Record<keyof SixAttributes, SingleAttr>> {}

export interface Soulmark {
  effect_id: number;
  args: number[];
}
