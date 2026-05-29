# JAK7 Trainer PID/Nature Notes

This note documents how trainer PID and nature generation differs between vanilla Pokemon Platinum and the `JAK7` ROM used by `pknightfinal.nds`.

Relevant exporter code:



## Vanilla Platinum

Vanilla Platinum trainer mons do not support the HGSS-style gender/ability override helper.

The effective flow is:

1. Start with:
   `seed = trainerId + species + level + difficulty`
2. Advance the Gen 4 LCRNG `trainerClass` times.
3. Build the PID as:
   `pid = (rand16 << 8) + genderMod`
4. `genderMod` is only:
   - `0x88` for male trainer classes
   - `0x78` for female trainer classes
5. Nature is then:
   `pid % 25`

So in vanilla Platinum:

- trainer `genderAbilityFlags` do not affect PID generation
- ability slot 2 does not shift the PID
- the low PID byte is fixed to the trainer-class gender constant

## JAK7

`JAK7` is still a Platinum-family ROM for file layout and resources, but its trainer PID behavior is not the vanilla Platinum one.

The important difference is the low PID term (`pidMod`):

- If `genderAbilityFlags == 0`, the mon behaves like vanilla Platinum and keeps the trainer-class base:
  - `0x88` for male trainer classes
  - `0x78` for female trainer classes
- If `genderAbilityFlags != 0`, this ROM uses the species id itself as the base `pidMod`
- Then it applies the override bits:
  - low nibble: gender override
    - `1` => `pidMod += 2`
    - `2` => `pidMod -= 2`
  - high nibble: ability override
    - `1` => force low bit clear
    - `2` => force low bit set

So the effective JAK7 formula used by the exporter is:

1. `seed = trainerId + species + level + difficulty`
2. Advance the Gen 4 LCRNG `trainerClass` times
3. Compute `pidMod`
4. `pid = (rand16 << 8) + pidMod`
5. `nature = pid % 25`

The critical point is that `pidMod` can be larger than `0xFF` on JAK7, because species ids like `409`, `485`, `477`, and `486` are used directly. That carry changes the higher PID bytes too.

Example from trainer `403`:

- Rampardos:
  - species `409`
  - flags `0x20` => ability 2
  - `pidMod = 409 | 1 = 409`
  - PID becomes `0xF04099`
  - Nature becomes `Brave`

If this were treated like vanilla Platinum or plain HGSS-style `0x88/0x78` logic, the PID and nature would be wrong.

## What Changed In ddex

Two exporter changes were required.

### 1. Route `JAK7` to its own trainer PID mode

`JAK7` is detected as Platinum for ROM resources, but trainer PID generation is routed separately:

- `DPPT` for vanilla Platinum behavior
- `HGSS` for HGSS-style backport behavior
- `JAK7` for this ROM-specific species-based `pidMod`

This is handled in:

- 

### 2. Fix the RNG multiply

The Gen 4 LCRNG step must use 32-bit overflow semantics:

```js
state = (Math.imul(0x41C64E6D, state) + 0x00006073) >>> 0;
```

Using normal JavaScript `*` is wrong here, because it loses precision on overflowed 32-bit multiplies.

That bug caused the exporter to pick the correct `JAK7` path but still generate wrong high PID bits, which in turn produced wrong natures such as Dusknoir showing up as `Relaxed` instead of `Lonely`.

The fix is in:



## Verified Trainer 403 Output

After both fixes, `buildOverridesFromRom()` reproduces trainer `403` from `pknightfinal.nds` as:

- Deoxys: `Quiet`
- Rampardos: `Brave`
- Heatran: `Rash`
- Registeel: `Sassy`
- Dusknoir: `Lonely`
- Regigigas: `Bold`

This matches the live dump from `trainer.json`.
