# zedit-unified-patching-framework
A zEdit module which provides a framework for dynamic patch generation, similar to SkyProc/SUM.

## patchers
Check out the following patchers to get an idea of how to use UPF:

- Example Patcher - [github](https://github.com/z-edit/zedit-example-patcher)
- Animated Armory - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/25969)
- Cell Encounter Level in Name - [github](https://github.com/z-edit/hishy-cell-encounter-level-in-name), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13542)
- Challenging Spell Learning - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/20521)
- ENB Light Patcher - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/22574)
- Enchantment Restriction Remover - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/17370/)
- Engarde - [nexus](https://www.nexusmods.com/skyrim/mods/97404)
- Experience Mod - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/23589)
- Fallout Genetics - everyone is beautiful - [nexus](https://www.nexusmods.com/fallout4/mods/35459)
- Hunterborn Patcher - [github](https://www.nexusmods.com/skyrimspecialedition/mods/17993)
- Keys Have Weight - [nexus](https://www.nexusmods.com/skyrim/mods/95168)
- Khajiit Ears Show - [github](https://github.com/hishutup/hishy-khajiit-ears-show), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13544)
- Know Your Enemy - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13807)
- Limited Perk Trees - [nexus](https://www.nexusmods.com/skyrim/mods/95540)
- NPC Enchant Fix - [github](https://github.com/z-edit/hishy-npc-enchant-fix), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13543)
- NPC Stat Rescaler - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/24254)
- No Distant LOD for NPCs - [nexus](https://www.nexusmods.com/skyrim/mods/95175)
- No Dragon LODs - [github](https://github.com/hishutup/hishy-no-dragon-lods), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/13541/)
- No Lowered Automatic Weapon Damage - [nexus](https://www.nexusmods.com/fallout4/mods/38805)
- No Lowered Suppressor and Bayonet Range - [nexus](https://www.nexusmods.com/fallout4/mods/38817)
- Pick Your Poison - [nexus](https://www.nexusmods.com/skyrim/mods/96473)
- Pra's zEdit Patchers - [nexus](https://www.nexusmods.com/fallout4/mods/33858)
- Randomized Birthstones Skyrim - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/23838)
- Reproccer Reborn - [github](https://github.com/jdsmith2816/reproccer-reborn), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/17913)
- SORT - Scripted Overrides that Rename Things - [nexus](https://www.nexusmods.com/skyrim/mods/87820/)
- Save Your Finger - [nexus](https://www.nexusmods.com/fallout4/mods/38781)
- Skyrim Material Patcher - [github](https://github.com/z-edit/zedit-skyrim-material-patcher)
- Total Equipment Overhaul (TEO) - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18157)
- True Unleveled Skyrim (TUS) - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18342)
- XP Editor - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/24356)
- dualSheathRedux - [github](https://github.com/Qudix/dualSheathRedux)
- loadScreenRemover - [github](https://github.com/Qudix/loadScreenRemover), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18279/)
- oppositeAnimationDisabler - [github](https://github.com/Qudix/oppositeAnimationDisabler), [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/18281)
- zEdit patchers warehouse - [nexus](https://www.nexusmods.com/skyrimspecialedition/mods/23254)

## installation

1. Download the [latest release archive](https://github.com/matortheeternal/zedit-unified-patching-framework/releases).
2. Extract the archive to zEdit's `modules` folder.
3. Run zEdit.

## dev notes
The `dist` branch contains the `dist` subtree, allowing it to be a submodule of the [zEdit](https://github.com/matortheeternal/zedit) repo.  The branch can be updated by running the command `git subtree split --branch dist --prefix dist/` on master. 
