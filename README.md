# zedit-unified-patching-framework
A zEdit module which provides a framework for dynamic patch generation, similar to SkyProc/SUM.

## patchers
Check out the following patchers to get an idea of how to use UPF:

- Example Patcher - [github](https://github.com/z-edit/zedit-example-patcher)
- No Dragon LODs - [github](https://github.com/hishutup/hishy-no-dragon-lods), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13541/)
- NPC Enchant Fix - [github](https://github.com/z-edit/hishy-npc-enchant-fix), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13543)
- Cell Encounter Level in Name - [github](https://github.com/z-edit/hishy-cell-encounter-level-in-name), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13542)
- Khajiit Ears Show - [github](https://github.com/hishutup/hishy-khajiit-ears-show), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13544)
- Enchantment Restriction Remover - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/17370/)
- True Equipment Overhaul (TEO) - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18157)
- True Unleveled Skyrim (TUS) - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18342)
- Hunterborn Patcher - [github](https://github.com/Hazado/Hunterborn-Creature-Patcher), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/17993)
- dualSheathRedux - [github](https://github.com/Qudix/dualSheathRedux)
- loadScreenRemover - [github](https://github.com/Qudix/loadScreenRemover), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18279/)
- oppositeAnimationDisabler - [github](https://github.com/Qudix/oppositeAnimationDisabler), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18281)
- Know Your Enemy - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13807)
- Reproccer Reborn - [github](https://github.com/jdsmith2816/reproccer-reborn), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/17913)
- Skyrim Material Patcher - [github](https://github.com/z-edit/zedit-skyrim-material-patcher)
- Pra's zEdit Patchers - [nexus](https://www.nexusmods.com/fallout4/mods/33858)
- SORT - Scripted Overrides that Rename Things - [nexus](https://www.nexusmods.com/skyrim/mods/87820/)
- Know Your Enemy - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13807)
- Randomized Birthstones Skyrim - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/23838)
- Engarde - [nexus](https://www.nexusmods.com/skyrim/mods/97404)
- Experience Mod - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/23589)
- zEdit patchers warehouse - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/23254)
- ENB Light Patcher - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/22574)
- Keys Have Weight - [nexus](https://www.nexusmods.com/skyrim/mods/95168)
- Fallout Genetics - everyone is beautiful - [nexus](https://www.nexusmods.com/fallout4/mods/35459)
- No Distant LOD for NPCs - [nexus](https://www.nexusmods.com/skyrim/mods/95175)
- Animated Armory - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/25969)
- Save Your Finger - [nexus](https://www.nexusmods.com/fallout4/mods/38781)
- No Lowered Suppressor and Bayonet Range - [nexus](https://www.nexusmods.com/fallout4/mods/38817)
- No Lowered Automatic Weapon Damage - [nexus](https://www.nexusmods.com/fallout4/mods/38805)
- NPC Stat Rescaler - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/24254)
- Challenging Spell Learning - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/20521)
- XP Editor - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/24356)
- Limited Perk Trees - [nexus](https://www.nexusmods.com/skyrim/mods/95540)
- Pick Your Poison - [nexus](https://www.nexusmods.com/skyrim/mods/96473)
- Speed and Reach Fix - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/29847)
- Action Speed - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/35097)
- Breakdown Recipe Generator - [github](https://github.com/Hazado/breakdownRecipeBuilder), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/38273/)

## installation

1. Download the [latest release archive](https://github.com/matortheeternal/zedit-unified-patching-framework/releases).
2. Extract the archive to zEdit's `modules` folder.
3. Run zEdit.

## dev notes
The `dist` branch contains the `dist` subtree, allowing it to be a submodule of the [zEdit](https://github.com/matortheeternal/zedit) repo.  The branch can be updated by running the command `git subtree split --branch dist --prefix dist/` on master. 
