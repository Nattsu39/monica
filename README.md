<div align="center">

# ❤Monica🪽
~~初始数值什么的我都仔细计算过了，大家放心吧！~~</br>
基于实际游戏数据的赛尔号精灵配置计算器

</div>

## 特色😋
该计算器基于数十个精灵的[实机面板数据](./__tests__/fixtures/collected-pets/)，保证了计算逻辑和结果与游戏的一致性，并提供详细的加成明细，比游戏内面板还好！

## 使用🔧
安装到你的项目中：
```bash
npm install seer-monica
```

使用：
```ts
import {
  calcPetAttr,
  defaultSelectionEntryFor,
  listAvailableBonuses,
  PRIORITY_CONSTS,
  type BonusSelectionEntry,
  type PetAttrCalcOptions,
} from 'seer-monica';

const petId = 3022;
const level = 100;
/** 魂印数据 */
const soulmark = {
  effect_id: 715,
  args: [75, 10, 15, 3, 20, 20, 0, 0],
};

// 1. 列出当前精灵可用的 registry 加成（战队 / 年费 / 魂印等）
const available = listAvailableBonuses({ id: petId, level, soulmark });
console.log(
  '可选加成:',
  available.selectable.map((d) => `${d.id}（${d.description}）`),
);

// 2. 选择要启用的加成
const bonusSelections: BonusSelectionEntry[] = [
  // 战队加成：满配加点（atk/def/spAtk/spDef 各 15，hp 30，spd 10）
  {
    id: 'team',
    selection: {
      kind: 'pool',
      allocation: {
        atk: 15,
        def: 15,
        hp: 30,
        spAtk: 15,
        spDef: 15,
        spd: 10,
      },
    },
  },
  // 年费加成：全属性 +10
  defaultSelectionEntryFor(
    available.selectable.find((d) => d.id === 'vip-year')!,
  ),
  // 715 号魂印：体力 +20%（args[4] = 20）
  defaultSelectionEntryFor(
    available.selectable.find((d) => d.id === 'soulmark-715')!,
  ),
];

// 3. 构建完整计算选项并计算
const petInfo: PetAttrCalcOptions = {
  id: petId,
  level,
  soulmark,
  // 种族值
  baseStats: {
    atk: 130,
    def: 106,
    hp: 163,
    spAtk: 75,
    spDef: 106,
    spd: 120,
  },
  // 个体值
  iv: 31,
  // 性格加成
  natureBonus: {
    atkPercent: 1.1,
    defPercent: 1,
    hpPercent: 1,
    spAtkPercent: 0.9,
    spDefPercent: 1,
    spdPercent: 1,
  },
  evs: {
    atk: 80,
    def: 100,
    hp: 230,
    spAtk: 0,
    spDef: 100,
    spd: 0,
  },
  mintmarks: [
    // 刻印：巨刃
    {
      atk: 55,
      def: 0,
      spAtk: 0,
      spDef: 0,
      spd: 0,
      hp: 110,
    },
    // 刻印：巨刃
    {
      atk: 55,
      def: 0,
      spAtk: 0,
      spDef: 0,
      spd: 0,
      hp: 110,
    },
    // 刻印：圣战之无限α
    {
      atk: 50,
      def: 25,
      spAtk: 50,
      spDef: 25,
      spd: 0,
      hp: 113,
    },
  ],
  // 加成选择
  bonusSelections,
  // 计算器内不提供装备/称号/能量珠加成数据，需自行填入
  extraBonuses: [
    {
      scope: 'base',
      value: {
        atkPercent: 10,
        defPercent: 10,
        hpPercent: 10,
        spAtkPercent: 10,
        spDefPercent: 10,
        spdPercent: 10,
        atk: 0,
        def: 0,
        spAtk: 0,
        spDef: 0,
        spd: 0,
        hp: 0,
      },
      priority: PRIORITY_CONSTS.base.EQUIPMENT_BONUS, // 装扮加成优先级（计算节点）
      description: '典狱官套装',
      source: '装扮加成',
    },
  ],
};

const result = calcPetAttr(petInfo);

console.log('\n面板计算结果:');
for (const stat of ['atk', 'def', 'hp', 'spAtk', 'spDef', 'spd'] as const) {
  console.log(`  ${stat}: ${result.base[stat].value}`);
}

console.log('\n加成明细（atk）:');
for (const detail of result.base.atk.details) {
  let string = `  ${detail.name} +${detail.value}（${detail.description}）`;
  if (detail.percent) {
    string += `（+${detail.percent}%）`;
  }
  console.log(string);
}

console.log('\n加成明细（hp）:');
for (const detail of result.base.hp.details) {
  let string = `  ${detail.name} +${detail.value}（${detail.description}）`;
  if (detail.percent) {
    string += `（+${detail.percent}%）`;
  }
  console.log(string);
}

```

## 莫妮卡的日记📙
在为计算器收集数据的过程中，我们发现了一些值得记录的事，详见[这里](./docs/monica-diary.md)。

## TODO🧪
- [ ] 繁殖精灵二代加成
- [ ] 异能精灵光效
- [ ] 谱尼特训
- [ ] 老头/圣武/天堂极龙兽等战斗内加成

## 致谢🫡
- [@HurryWang](https://seerinfo.yuyuqaq.cn/)
- [@朵佬](https://crispww.cn/SEER/)
- [@夜黎](https://github.com/DawnNights)
- [@鸡翅少侠](https://space.bilibili.com/234073672)
- [@二代王刻何时归](https://space.bilibili.com/3493126167595014)

以及Sunrise战队的阿肥，文皇，表哥等群友。