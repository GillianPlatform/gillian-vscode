# The Gillian Platform - VSCode extension
*The official VSCode extension for [The Gillian Platform](https://github.com/GillianPlatform/Gillian)*

This extension provides:
- Debugger support for Gillian
- Language server support for Gillian
- Syntax highlighting for GIL, JSIL & WISL

## Repository structure
This repository contains:
- [`./extension`](./extension): the VSCode extension
- [`./debug-ui`](./debug-ui): the web app used for the extension's debugging UI
- [`./examples`](./examples): some example programs to try the extension on

## Quick start
To try out the extension, set up the project with:
```bash
npm i
```

Then, go to the *"Run and Debug"* sidebar and click the play button with *"Run Extension"* selected.

![](./run-extension.png)

This assumes that you have the Gillian source code in the sibling directory `../Gillian`; if not, adjust `gillian.sourceDirectory` in [`examples/.vscode/settings.json`](./examples/.vscode/settings.json).
