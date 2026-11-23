/** Defines Gillian's Debug Adapter, which tells VSCode how to execute Gillian for debugging. */

import { mkdirSync } from "fs";
import * as vscode from "vscode";
import { ProviderResult } from "vscode";
import { expandPath, expandCommand, parseCmdArgs } from "../util/vscodeVariables";

export class DebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {
  createDebugAdapterDescriptor(
    _session: vscode.DebugSession,
  ): ProviderResult<vscode.DebugAdapterDescriptor> {
    const fileExtension = _session.configuration.program.split(".").pop();
    let langCmd: string;
    // Match of the file extension first
    switch (fileExtension) {
      case "c":
        langCmd = "gillian-c2";
        break;
      case "js":
        langCmd = "gillian-js";
        break;
      case "wisl":
        langCmd = "wisl";
        break;
      case "gil":
        // Check the target language if it is a GIL file
        switch (_session.configuration.targetLanguage) {
          case "js":
            langCmd = "gillian-js";
            break;
          case "c":
            langCmd = "gillian-c";
            break;
          case "c2":
            langCmd = "gillian-c2";
            break;
          case "wisl":
          default:
            // Default to WISL
            langCmd = "wisl";
            break;
        }
        break;
      default:
        // Default to WISL
        langCmd = "wisl";
        break;
    }

    const config = vscode.workspace.getConfiguration("gillian");
    const langConfig = vscode.workspace.getConfiguration(`gillian.${langCmd}`);
    console.log("Configuring debugger...", { config });

    const workspaceFolder = _session.workspaceFolder;
    const extraArgs: string = expandPath(langConfig.commandLineArguments, workspaceFolder);

    const mode = _session.configuration.execMode || "verify";

    const env = langConfig.environmentVariables || {};
    const args_s = [
      "debug",
      mode,
      "-r",
      "db",
      ...(config.useManualProof ? ["-m"] : []),
      extraArgs,
    ].join(" ");
    let cmd_s: string;
    let cwd: string;

    if (config.runMode === "installed") {
      cwd = expandPath(config.outputDirectory || "./.gillian", workspaceFolder);
      const binDirectory = config.binDirectory;
      const path = binDirectory ? expandPath(binDirectory, workspaceFolder) + "/" : "";
      mkdirSync(cwd, { recursive: true }); // must exist before spawn, or it fails with ENOENT
      cmd_s = `${path}${langCmd} ${args_s}`;
    } else {
      let sourceDirectory = config.sourceDirectory;
      if (!sourceDirectory) {
        throw Error("Please specify the location of Gillian source code");
      }
      sourceDirectory = expandPath(sourceDirectory, workspaceFolder);
      cwd = sourceDirectory;
      const tmpl = config.sourceExecTemplate || "${command}";
      cmd_s = expandCommand(tmpl, `${langCmd} ${args_s}`, workspaceFolder);
    }

    const [cmd, ...args] = parseCmdArgs(cmd_s);

    console.log("Starting debugger...", { cmd, args, env, cwd });
    const options = { cwd, env };
    return new vscode.DebugAdapterExecutable(cmd, args, options);
  }
}
