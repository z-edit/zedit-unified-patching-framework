# zedit-unified-patching-framework
A zEdit module which provides a framework for dynamic patch generation, similar to SkyProc/SUM.

## patchers
Check out the following patchers to get an idea of how to use UPF:

- [Example Patcher](https://github.com/matortheeternal/zedit-example-patcher)
- [Reproccer Reborn](https://github.com/jdsmith2816/reproccer-reborn)

## installation

1. Download the [latest release archive](https://github.com/matortheeternal/zedit-unified-patching-framework/releases).
2. Extract the archive to zEdit's `modules` folder.
3. Run zEdit.

## dev notes
The `dist` branch contains the `dist` subtree, allowing it to be a submodule of the [zEdit](https://github.com/matortheeternal/zedit) repo.  The branch can be updated by running the command `git subtree split --branch dist --prefix dist/` on master. 