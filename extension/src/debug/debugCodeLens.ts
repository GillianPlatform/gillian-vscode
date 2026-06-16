import {
  CodeLens,
  CodeLensProvider,
  commands,
  ExtensionContext,
  languages,
  Range,
  TextDocument,
  workspace,
} from "vscode";
import { startDebugging } from "./startDebugging";
import { DEBUG_TYPE } from "../util/consts";

type ExecMode = "verify" | "wpst";

export function activateCodeLens(context: ExtensionContext) {
  const commandDisposable = commands.registerCommand(
    "extension.gillian.debugProcedure",
    startDebugging,
  );

  const supportedLanguages = ["javascript", "gil", "wisl", "c"];

  for (const language of supportedLanguages) {
    const docSelector = {
      language: language,
      scheme: "file",
    };

    const codeLensProviderDisposable = languages.registerCodeLensProvider(
      docSelector,
      new DebugCodeLensProvider(),
    );

    context.subscriptions.push(commandDisposable);
    context.subscriptions.push(codeLensProviderDisposable);
  }
}

function getLensKinds(lang: string | undefined): Map<ExecMode, string> {
  let showVerifyLens = true;
  let showSymbolicDebugLens = true;
  if (lang) {
    const langConfig = workspace.getConfiguration(`gillian.${lang}`);
    showVerifyLens = langConfig.showVerifyButton;
    showSymbolicDebugLens = langConfig.showSymbolicDebugButton;
  }
  const lensKinds = new Map();
  if (showVerifyLens) {
    lensKinds.set("verify", "Verify");
  }
  if (showSymbolicDebugLens) {
    lensKinds.set("wpst", "Symbolic-debug");
  }
  return lensKinds;
}

class DebugCodeLensProvider implements CodeLensProvider {
  private makeLensesFromPattern(pattern: RegExp, document: TextDocument): CodeLens[] {
    const text = document.getText();
    const procNamePattern = /(.+?)\(/g;

    let langCmd: string | undefined = undefined;
    switch (document.languageId) {
      case "gil":
        break;
      case "javascript":
        langCmd = "gillian-js";
        break;
      case "wisl":
        langCmd = "wisl";
        break;
      default:
        break;
    }

    const lensKinds = getLensKinds(langCmd);
    const lenses: CodeLens[] = [];
    while (pattern.exec(text) !== null) {
      procNamePattern.lastIndex = pattern.lastIndex;
      const match = procNamePattern.exec(text);
      const procedureName = match === null ? null : match[1].trim();
      if (procedureName) {
        for (const [execMode, commandPrefix] of lensKinds.entries()) {
          const codeLens = this.makeCodeLens(
            procNamePattern.lastIndex,
            procedureName,
            document,
            execMode,
            commandPrefix,
          );
          if (codeLens !== undefined) {
            lenses.push(codeLens);
          }
        }
      }
    }

    return lenses;
  }

  private makeCLens(document: TextDocument): CodeLens[] {
    const text = document.getText();
    const lensKinds = getLensKinds("gillian-c2");

    const lenses: CodeLens[] = [];

    if (lensKinds.has("wpst")) {
      const mainPattern = /int\s+main\s*\(\)/g;
      let match = mainPattern.exec(text);
      while (match !== null) {
        const ix = match.index + "int main".length;
        const codeLens = this.makeCodeLens(ix, "main", document, "wpst", lensKinds.get("wpst")!);
        if (codeLens !== undefined) {
          lenses.push(codeLens);
        }
        match = mainPattern.exec(text);
      }
    }

    if (lensKinds.has("verify")) {
      const scPattern = /\/\*@.+?\*\//gs;
      const specPattern = /spec (.+?)\(/g;
      let scMatch;
      while ((scMatch = scPattern.exec(text)) !== null) {
        const scIx = scMatch.index;
        const sc = scMatch[0];
        let specMatch;
        while ((specMatch = specPattern.exec(sc)) !== null) {
          const ix = scIx + specMatch.index + specMatch[0].length - 1;
          const codeLens = this.makeCodeLens(
            ix,
            specMatch[1],
            document,
            "verify",
            lensKinds.get("verify")!,
          );
          if (codeLens !== undefined) {
            lenses.push(codeLens);
          }
        }
      }
    }

    return lenses;
  }

  async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    let pattern: RegExp;
    switch (document.languageId) {
      case "gil":
        pattern = /proc /g;
        break;
      case "c":
        return this.makeCLens(document);
      case "javascript":
      case "wisl":
      default:
        pattern = /^(?:(?!\s*\/\/.+))function /gm;
        break;
    }

    return this.makeLensesFromPattern(pattern, document);
  }

  private makeCodeLens(
    index: number,
    procedureName: string,
    document: TextDocument,
    execMode: ExecMode,
    commandPrefix: string,
  ) {
    const startIdx = index - procedureName.length;
    const start = document.positionAt(startIdx);
    const end = document.positionAt(index);
    const range = new Range(start, end);
    const debugConfig = this.createDebugConfig(procedureName, document.uri.fsPath, execMode);
    const title = `${commandPrefix} ${procedureName}`;
    return new CodeLens(range, {
      command: "extension.gillian.debugProcedure",
      title,
      tooltip: title,
      arguments: [debugConfig],
    });
  }

  private createDebugConfig(procedureName: string, program: string, execMode: ExecMode) {
    return {
      type: DEBUG_TYPE,
      name: "Debug File",
      request: "launch",
      program: program,
      procedureName: procedureName,
      stopOnEntry: true,
      execMode,
    };
  }
}
