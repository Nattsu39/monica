import type { Soulmark } from '../types.js';
import type { BonusDescriptor, PetBonusContext } from './types.js';
import type { TransformDescriptor } from './transforms/types.js';

/** 魂印属性变换：仅按 effect_id 注册 */
export interface SoulmarkTransformRegistration {
  readonly effectId: number;
  readonly descriptorId: string;
  readonly buildDescriptor: (
    soulmark: Soulmark,
    context: PetBonusContext,
  ) => TransformDescriptor;
}

/** 全员可用加成（战队、年费加成），lookup 时始终命中 */
export interface GlobalBonusRegistration {
  readonly descriptor: BonusDescriptor;
}

/** 特定精灵专属加成 */
export interface PetBonusRegistration {
  readonly petIds: readonly number[];
  readonly descriptor: BonusDescriptor;
}

/** 魂印加成：仅按 effect_id 注册，不绑定精灵列表 */
export interface SoulmarkBonusRegistration {
  readonly effectId: number;
  readonly descriptorId: string;
  readonly buildDescriptor: (
    soulmark: Soulmark,
    context: PetBonusContext,
  ) => BonusDescriptor;
}

/** 集中管理全局 / 精灵专属 / 魂印三类加成与 lookup 匹配 */
export class BonusRegistry {
  private readonly globalBonuses: GlobalBonusRegistration[] = [];
  private readonly petBonuses: PetBonusRegistration[] = [];
  private readonly soulmarkBonuses: SoulmarkBonusRegistration[] = [];
  private readonly soulmarkTransforms: SoulmarkTransformRegistration[] = [];
  private readonly registeredIds = new Set<string>();

  /** 注册全员可用加成 */
  registerGlobalBonus(entry: GlobalBonusRegistration): this {
    this.assertNewId(entry.descriptor.id);
    this.globalBonuses.push(entry);
    return this;
  }

  /** 注册特定精灵专属加成 */
  registerPetBonus(entry: PetBonusRegistration): this {
    this.assertNewId(entry.descriptor.id);
    this.petBonuses.push(entry);
    return this;
  }

  /** 注册魂印加成（仅 effect_id，运行时由 context.soulmark 匹配） */
  registerSoulmarkBonus(entry: SoulmarkBonusRegistration): this {
    this.assertNewId(entry.descriptorId);
    this.soulmarkBonuses.push(entry);
    return this;
  }

  /** 注册魂印属性变换（仅 effect_id，装备时自动生效） */
  registerSoulmarkTransform(entry: SoulmarkTransformRegistration): this {
    this.assertNewId(entry.descriptorId);
    this.soulmarkTransforms.push(entry);
    return this;
  }

  /** 按上下文返回当前精灵可用的加成描述（global → pet → soulmark） */
  lookup(context: PetBonusContext): readonly BonusDescriptor[] {
    const result: BonusDescriptor[] = [];

    for (const entry of this.globalBonuses) {
      result.push(entry.descriptor);
    }

    for (const entry of this.petBonuses) {
      if (entry.petIds.includes(context.id)) {
        result.push(entry.descriptor);
      }
    }

    const soulmark = context.soulmark;
    if (soulmark !== undefined) {
      for (const entry of this.soulmarkBonuses) {
        if (soulmark.effect_id === entry.effectId) {
          result.push(entry.buildDescriptor(soulmark, context));
        }
      }
    }

    return result;
  }

  /** 按上下文返回当前精灵可用的属性变换描述 */
  lookupTransforms(context: PetBonusContext): readonly TransformDescriptor[] {
    const soulmark = context.soulmark;
    if (soulmark === undefined) {
      return [];
    }

    const result: TransformDescriptor[] = [];
    for (const entry of this.soulmarkTransforms) {
      if (soulmark.effect_id === entry.effectId) {
        result.push(entry.buildDescriptor(soulmark, context));
      }
    }
    return result;
  }

  /** 按 descriptor id 注销条目 */
  unregister(descriptorId: string): boolean {
    if (!this.registeredIds.has(descriptorId)) {
      return false;
    }

    const globalIndex = this.globalBonuses.findIndex(
      (e) => e.descriptor.id === descriptorId,
    );
    if (globalIndex !== -1) {
      this.globalBonuses.splice(globalIndex, 1);
      this.registeredIds.delete(descriptorId);
      return true;
    }

    const petIndex = this.petBonuses.findIndex(
      (e) => e.descriptor.id === descriptorId,
    );
    if (petIndex !== -1) {
      this.petBonuses.splice(petIndex, 1);
      this.registeredIds.delete(descriptorId);
      return true;
    }

    const soulmarkIndex = this.soulmarkBonuses.findIndex(
      (e) => e.descriptorId === descriptorId,
    );
    if (soulmarkIndex !== -1) {
      this.soulmarkBonuses.splice(soulmarkIndex, 1);
      this.registeredIds.delete(descriptorId);
      return true;
    }

    const soulmarkTransformIndex = this.soulmarkTransforms.findIndex(
      (e) => e.descriptorId === descriptorId,
    );
    if (soulmarkTransformIndex !== -1) {
      this.soulmarkTransforms.splice(soulmarkTransformIndex, 1);
      this.registeredIds.delete(descriptorId);
      return true;
    }

    return false;
  }

  clear(): void {
    this.globalBonuses.length = 0;
    this.petBonuses.length = 0;
    this.soulmarkBonuses.length = 0;
    this.soulmarkTransforms.length = 0;
    this.registeredIds.clear();
  }

  private assertNewId(id: string): void {
    if (this.registeredIds.has(id)) {
      throw new Error(`加成 ${id}：已注册，不可重复`);
    }
    this.registeredIds.add(id);
  }
}

export const defaultBonusRegistry = new BonusRegistry();
