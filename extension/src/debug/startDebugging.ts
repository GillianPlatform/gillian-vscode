/** Wrapper function for initiating a Gillian debugging session. */

import { debug, DebugConfiguration, DebugSession, window } from "vscode";

let debugSession: DebugSession | null = null;
let isDebugStarting = false;

debug.onDidStartDebugSession((session) => {
  debugSession = session;
});

debug.onDidTerminateDebugSession(() => {
  debugSession = null;
});

async function checkForExistingDebugSession() {
  if (!debug.activeDebugSession) {
    debugSession = null;
  }
  if (debugSession !== null) {
    await debug.stopDebugging(debugSession);
  }
}

export async function startDebugging(config: DebugConfiguration, noDebug = false) {
  if (isDebugStarting) {
    return;
  }
  isDebugStarting = true;
  try {
    await checkForExistingDebugSession();
    const validLangs = ["WISL", "JS", "C (CompCert)", "C (CBMC)"];
    const langOptions: Map<string, string> = new Map([
      ["WISL", "wisl"],
      ["JS", "js"],
      ["C (CompCert)", "c"],
      ["C (CBMC)", "c2"],
    ]);

    const fileExtension = config.program.split(".").pop();
    if (fileExtension === "gil") {
      const selected = await window.showQuickPick(validLangs, {
        title: "Target language",
      });
      const targetLanguage = selected ? langOptions.get(selected) : undefined;
      if (!targetLanguage) {
        // Do not start debugger if invalid target language specified for GIL file
        return;
      }
      config = {
        targetLanguage: targetLanguage,
        ...config,
      };
    }

    await debug.startDebugging(undefined, config, { noDebug: noDebug });
  } finally {
    isDebugStarting = false;
  }
}
