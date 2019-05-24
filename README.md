# zedit-unified-patching-framework
A zEdit module which provides a framework for dynamic patch generation, similar to SkyProc/SUM.

## patchers
Check out the following patchers to get an idea of how to use UPF:

- [Example Patcher](https://github.com/matortheeternal/zedit-example-patcher)
- [No Dragon LODs](https://github.com/hishutup/hishy-no-dragon-lods)
- [NPC Enchant Fix](https://github.com/hishutup/hishy-npc-enchant-fix)
- [Cell Encounter Level in Name](https://github.com/hishutup/hishy-cell-encounter-level-in-name)
- [Khajiit Ears Show](https://github.com/hishutup/hishy-khajiit-ears-show)
- [Total Equipment Overhaul (TEO)](https://www.nexusmods.com/skyrimspecialedition/mods/18157)
- [True Unleveled Skyrim (TUS)](https://www.nexusmods.com/skyrimspecialedition/mods/18342)
- [Hunterborn Patcher](https://www.nexusmods.com/skyrimspecialedition/mods/17993)
- [dualSheathRedux](https://github.com/Qudix/dualSheathRedux)
- [loadScreenRemover](https://github.com/Qudix/loadScreenRemover)
- [oppositeAnimationDisabler](https://github.com/Qudix/oppositeAnimationDisabler)
- [Reproccer Reborn](https://github.com/jdsmith2816/reproccer-reborn)
- [Skyrim Material Patcher](https://github.com/z-edit/zedit-skyrim-material-patcher)
- [Pra's zEdit Patchers](https://www.nexusmods.com/fallout4/mods/33858)
- [Know Your Enemy](https://www.nexusmods.com/skyrimspecialedition/mods/13807)
- [Randomized Birthstones Skyrim](https://www.nexusmods.com/skyrimspecialedition/mods/23838)
- [Engarde](https://www.nexusmods.com/skyrim/mods/97404)
- [Experience Mod](https://www.nexusmods.com/skyrimspecialedition/mods/23589)
- [zEdit patchers warehouse](https://www.nexusmods.com/skyrimspecialedition/mods/23254)
- [ENB Light Patcher](https://www.nexusmods.com/skyrimspecialedition/mods/22574)

## installation

1. Download the [latest release archive](https://github.com/matortheeternal/zedit-unified-patching-framework/releases).
2. Extract the archive to zEdit's `modules` folder.
3. Run zEdit.

## dev notes
The `dist` branch contains the `dist` subtree, allowing it to be a submodule of the [zEdit](https://github.com/matortheeternal/zedit) repo.  The branch can be updated by running the command `git subtree split --branch dist --prefix dist/` on master. 
