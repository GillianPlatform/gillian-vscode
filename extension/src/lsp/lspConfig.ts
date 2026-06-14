import { ExtensionContext, Uri, workspace, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import { expandCommand, expandPath, parseCmdArgs } from "../util/vscodeVariables";

const clients: Record<string, LanguageClient> = {};

function startLsp(langCmd: string, name: string, language: string) {
  const config = workspace.getConfiguration("gillian");
  const langConfig = workspace.getConfiguration(`gillian.${langCmd}`);

  const mode = "verify";
  const workspaceFolder = workspace.workspaceFolders?.[0];
  const extraArgs: string = expandPath(langConfig.commandLineArguments, workspaceFolder);

  const args_s = ["lsp", mode, ...(config.useManualProof ? ["-m"] : []), extraArgs].join(" ");
  let cmd_s: string;
  let cwd: string;

  if (config.runMode === "installed") {
    cwd = expandPath(config.outputDirectory || "./.gillian", workspaceFolder);
    const binDirectory = config.binDirectory;
    const path = binDirectory ? expandPath(binDirectory, workspaceFolder) + "/" : "";
    workspace.fs.createDirectory(Uri.file(cwd));
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

  const [command, ...args_] = parseCmdArgs(cmd_s);
  const args = args_.map((s) => `'${s}'`);

  console.log("attempting LSP", { command, args, cwd });

  const serverOptions: ServerOptions = {
    command,
    args,
    options: {
      cwd,
      shell: true,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: language }],
    middleware: {
      async provideDiagnostics(doc, prevId, token, next) {
        const requestPromise = next(doc, prevId, token);
        const timeoutPromise: Promise<never> = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("WISL LSP timed out")), 5000);
        });
        return Promise.race([requestPromise, timeoutPromise]);
      },
    },
  };

  const id = `gillian-lsp-${langCmd}`;
  console.log("Launching LSP client", { id, name, serverOptions, clientOptions });
  const client = new LanguageClient(id, name, serverOptions, clientOptions);
  clients.langCmd = client;
  client.start();
}

async function stopLsp(langCmd: string) {
  const client = clients[langCmd];
  if (!client || !client.isRunning()) return false;
  await client.stop();
  return true;
}

async function restartLsp(langCmd: string, name: string, language: string) {
  await stopLsp(langCmd);
  startLsp(langCmd, name, language);
}

function startWislLsp() {
  startLsp("wisl", "WISL Language Server", "wisl");
}

function restartWislLsp() {
  restartLsp("wisl", "WISL Language Server", "wisl");
}

export function activateLsp(context: ExtensionContext) {
  startWislLsp();

  context.subscriptions.push(
    commands.registerCommand("extension.gillian.restartWislLSP", () => {
      restartWislLsp();
    }),
  );
}

export function deactivateLSP() {
  for (const [lang, client] of Object.entries(clients)) {
    if (client.isRunning()) client.stop();
    delete clients[lang];
  }
}
