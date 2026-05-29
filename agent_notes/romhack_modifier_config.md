# Romhack Modifier Profiles

The romhack modifier system lets `gen4.js` and `gen56.js` stay mostly vanilla while game-specific behavior lives in separate profile files under `calc/mechanics/romhacks/`.

## How Profile Resolution Works

1. Each damage calculator reads the current global `TITLE` once near the top of the calculation.
2. `getMechanicsProfile(title, gen.num)` returns the first matching profile from `calc/mechanics/romhacks/index.js`.
3. If no profile matches, the vanilla no-op profile is returned.
4. The calculator builds a shared `ctx` object and passes it to hook points during calculation.

The shared `ctx` object contains:

```js
{
    gen,
    attacker,
    defender,
    move,
    field,
    title,
    desc,
    util,
    state: {}
}
```

`state` is for temporary per-calculation details, such as `hitCount`, `typeEffectiveness`, `modifierId`, or values that a hook needs to read or change.

## Hook Types

Profiles are plain JavaScript modules created with `makeProfile`.

```js
exports.myHackProfile = makeProfile({
    id: "my-hack",
    gens: [5, 6],
    titleMatchers: [{ equals: "My Hack" }],
    hooks: {
        attackMods: [
            function (ctx, atMods) {
                return atMods;
            }
        ]
    }
});
```

Available hooks:

- `beforeStats(ctx)`: runs before final stats are computed.
- `afterMoveType(ctx)`: runs after initial move type changes.
- `typeEffectiveness(ctx, currentEffectiveness)`: can override type effectiveness.
- `moveBasePower(ctx, basePower)`: can override move-specific base power.
- `basePowerMods(ctx, bpMods)`: can add or replace base-power mods.
- `attackMods(ctx, atMods)`: can add or replace attack-stat mods.
- `defenseMods(ctx, dfMods)`: can add or replace defense-stat mods.
- `baseDamage(ctx, baseDamage)`: can alter base damage before final damage.
- `finalMods(ctx, finalMods)`: can add final damage mods.
- `beforeFinalDamage(ctx)`: can mutate state before final damage is calculated.

Hooks that receive a value should return the changed value. Returning `undefined` means "leave it unchanged."

## Example: Choice Band Is 1.75x For One Game

Choice Band is an attack-stat modifier in gen56. Vanilla uses fixed-point damage mods where `4096` means `1.0x`.

Common values:

- `6144` = `1.5x`
- `7168` = `1.75x`
- `8192` = `2.0x`

### Step 1: Create Or Pick A Profile

For a new game, add a profile file:

`calc/mechanics/romhacks/profiles/my-hack.js`

```js
"use strict";
exports.__esModule = true;

var helpers_1 = require("../helpers");

var myHackProfile = (0, helpers_1.makeProfile)({
    id: "my-hack",
    gens: [5, 6],
    titleMatchers: [{ equals: "My Hack" }],
    hooks: {
        attackMods: [
            function (ctx, atMods) {
                if (ctx.attacker.hasItem("Choice Band") && ctx.move.category === "Physical") {
                    var defaultIndex = atMods.lastIndexOf(6144);
                    if (defaultIndex !== -1) {
                        atMods[defaultIndex] = 7168;
                    }
                    else {
                        atMods.push(7168);
                    }
                    ctx.desc.attackerItem = ctx.attacker.item;
                }
                return atMods;
            }
        ]
    }
});

exports.myHackProfile = myHackProfile;
```

This works because `gen56.js` calls the `attackMods` hook after vanilla attack mods are collected and before they are chained.

### Step 2: Register The Profile

In `calc/mechanics/romhacks/index.js`, import and add the profile:

```js
var my_hack_1 = require("./profiles/my-hack");

var profiles = [
    cascade_white_1.cascadeWhiteProfile,
    platinum_kaizo_1.platinumKaizoProfile,
    my_hack_1.myHackProfile
];
```

Profile order matters if two profiles can match the same title. Put the more specific profile first.

### Step 3: Load It In The Browser

If the calculator is loaded through `index.html`, add the script before `romhacks/index.js`:

```html
<script type="text/javascript" src="./calc/mechanics/romhacks/profiles/my-hack.js?1"></script>
```

### Step 4: Test It

Add a test that compares:

- `"NONE"` with Choice Band
- `"My Hack"` with Choice Band
- `"My Hack"` without Choice Band

The `"My Hack"` Choice Band result should be about `1.75x` the no-item result, allowing for Pokemon rounding.

## Cleaner Pattern For Future Item Overrides

The current `attackMods` hook can replace `6144` with `7168`, but it relies on knowing vanilla already pushed a `6144` mod for Choice Band.

For heavily customized items, a cleaner future pattern is to add a named handoff in `gen56.js` around the Choice Band block, similar to the existing base-power `modifierId` handoffs:

```js
ctx.state.modifierId = "choiceAttackItem";
ctx.state.defaultMod = 6144;
atMods = applyValueHooks(profile, "attackMods", ctx, atMods);
ctx.state.modifierId = undefined;
```

Then a profile can explicitly handle only that item modifier:

```js
if (ctx.state.modifierId === "choiceAttackItem" &&
    ctx.attacker.hasItem("Choice Band") &&
    ctx.move.category === "Physical") {
    ctx.state.skipDefaultMod = true;
    atMods.push(7168);
    return atMods;
}
```

Use this named-handoff approach when a romhack needs many item or ability overrides in the same phase. It avoids accidentally replacing another unrelated `6144` modifier.

