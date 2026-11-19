import { ExtensionContext, Uri, workspace, commands, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import { expandCommand, expandPath, parseCmdArgs } from "../util/vscodeVariables";

const clients: Record<string, LanguageClient> = {};

function startLsp(langCmd: string, name: string, language: string) {
  if (clients[langCmd]) return; // already started; restartLsp stops it first
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
  const langEnv = langConfig.environmentVariables || {};
  const env = { ...process.env, ...langEnv };

  console.log("attempting LSP", { command, args, env: langEnv, cwd });

  const serverOptions: ServerOptions = {
    command,
    args,
    options: {
      cwd,
      // spawn replaces the env; merge so it matches the debugger's DebugAdapterExecutable
      env,
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
  clients[langCmd] = client;
  client.start();
}

async function stopLsp(langCmd: string) {
  const client = clients[langCmd];
  if (!client) return false;
  delete clients[langCmd];
  if (client.needsStop()) await client.stop();
  return true;
}

async function restartLsp(langCmd: string, name: string, language: string) {
  await stopLsp(langCmd);
  startLsp(langCmd, name, language);
}

// Settings read by startLsp; changing any of them restarts the server
const wislLspSettings = [
  "runMode",
  "outputDirectory",
  "binDirectory",
  "sourceDirectory",
  "sourceExecTemplate",
  "useManualProof",
  "wisl.commandLineArguments",
  "wisl.environmentVariables",
].map((s) => `gillian.${s}`);

async function restartWislLsp() {
  try {
    await restartLsp("wisl", "WISL Language Server", "wisl");
  } catch (e) {
    window.showErrorMessage(`Failed to start WISL language server: ${e}`);
  }
}

export function activateLsp(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("extension.gillian.restartWislLSP", restartWislLsp),
    workspace.onDidChangeConfiguration((e) => {
      if (wislLspSettings.some((s) => e.affectsConfiguration(s))) restartWislLsp();
    }),
  );
  restartWislLsp();
}

export function deactivateLSP() {
  for (const [lang, client] of Object.entries(clients)) {
    if (client.needsStop()) client.stop();
    delete clients[lang];
  }
}
