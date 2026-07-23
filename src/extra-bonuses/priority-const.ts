const BASE_PRIORITY_CONSTS = {
  /** 道具加成 */
  ITEM_BONUS: 10,
  /** 专属特性加成 */
  SOULMARK_BONUS: 20,
  /** 装扮加成 */
  EQUIPMENT_BONUS: 30,
  /** 超能加成 */
  SUPERNONO_BONUS: 40,
  /** 特殊加成 */
  SPECIAL_BONUS: 50,
} as const;

const SCOPE_PRIORITY_CONSTS = {
  /** 道具加成 */
  ITEM_BONUS: 110,
  /** 专属特性加成 */
  SOULMARK_BONUS: 120,
  /** 装扮加成 */
  EQUIPMENT_BONUS: 130,
  /** 超能加成 */
  SUPERNONO_BONUS: 140,
  /** 特殊加成 */
  SPECIAL_BONUS: 150,
} as const;

export const PRIORITY_CONSTS = {
  base: BASE_PRIORITY_CONSTS,
  pve: SCOPE_PRIORITY_CONSTS,
  pvp: SCOPE_PRIORITY_CONSTS,
} as const;
