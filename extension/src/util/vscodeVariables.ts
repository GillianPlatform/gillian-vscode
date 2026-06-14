// Adapted from https://github.com/DominicVonk/vscode-variables (MIT License)

import * as vscode from "vscode";
import { env } from "process";
import { sep } from "path";
import { parse } from "shell-quote";

function selectWorkspace(): vscode.WorkspaceFolder {
  const workspaces = vscode.workspace.workspaceFolders || [];
  if (workspaces.length === 0) {
    const msg = "No workspace folder found!";
    vscode.window.showErrorMessage(msg);
    throw new Error(msg);
  }
  if (workspaces.length === 1) {
    return workspaces[0];
  }
  // TODO: Multi-root workspaces
  const msg = "Multi-root workspaces are not yet supported!";
  vscode.window.showErrorMessage(msg);
  throw new Error(msg);
}

export default function variables(
  s: string,
  workspaceFolder?: vscode.WorkspaceFolder | undefined,
  command?: string | undefined,
): string {
  const workspace = workspaceFolder || selectWorkspace();
  s = s.replace(/\${workspaceFolder}/g, workspace?.uri.fsPath);
  s = s.replace(/\${workspaceFolderBasename}/g, workspace?.name);
  if (command) {
    s = s.replace(/\${command}/g, command);
    s = s.replace(/\${commandQuoted}/g, command.replaceAll("'", "\\'"));
  }
  s = s.replace(/\${fileWorkspaceFolder}/g, workspace?.uri.fsPath);
  s = s.replace(/\${pathSeparator}/g, sep);
  s = s.replace(/\${env:(.*?)}/g, (variable) => {
    const matches = variable.match(/\${env:(.*?)}/);
    if (matches) {
      return env[matches[1]] || variable;
    }
    return variable; // leave untouched
  });
  s = s.replace(/\${config:(.*?)}/g, (variable) => {
    const matches = variable.match(/\${config:(.*?)}/);
    if (matches) {
      return vscode.workspace.getConfiguration().get(matches[1], variable);
    }
    return variable; // leave untouched
  });

  return s;
}

export function expandPath(s: string, workspaceFolder: vscode.WorkspaceFolder | undefined): string {
  if (s.startsWith("~/")) {
    s = "${env:HOME}" + s.substring(1);
  }
  return variables(s, workspaceFolder);
}

export function expandCommand(
  s: string,
  command: string,
  workspaceFolder?: vscode.WorkspaceFolder | undefined,
): string {
  return variables(s, workspaceFolder, command);
}

export function parseCmdArgs(s: string): string[] {
  return parse(s).map((x) => {
    if (typeof x === "string") {
      return x;
    }
    if ("op" in x) {
      if (x.op === "glob") {
        return x.pattern;
      }
      return x.op;
    }
    return x.comment;
  });
}
