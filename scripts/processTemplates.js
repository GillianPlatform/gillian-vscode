const { join, sep } = require("path");
const fs = require("fs");

const fileSuffix = ".tmpl";

const patterns = {
  exerciseLine: /([\t ]*)\/\/\+(.+)\n/g,
  solutionLine: /([\t ]*)\/\/\-(.+)\n/g,
  hint: /[\t ]*\/\/\?\? .+\n(?:[\t ]*\/\/\? .+\n)*/g,
  hintLine: /[\t ]*\/\/\?\?? (.+)/
}

function clearDirs(dirs) {
  for (const dir of Object.values(dirs)) {
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        fs.rmSync(join(dir, f), { recursive: true, force: true });
      }
    }
  }
}

function findTemplateFiles(dir) {
  const allFiles = fs.readdirSync(dir, { recursive: true });
  const templateFiles = allFiles
    .filter((file) => file.endsWith(fileSuffix))
    .map((file) => file.substring(0, file.length - fileSuffix.length));
  return templateFiles;
}

function getExerciseContent(content) {
  return content
    .replace(patterns.exerciseLine, "$1$2\n")
    .replace(patterns.solutionLine, "")
    .replace(patterns.hint, "");
}

function getSolutionContent(content) {
  return content
    .replace(patterns.exerciseLine, "")
    .replace(patterns.solutionLine, "$1$2\n")
    .replace(patterns.hint, "");
}

function getHints(content) {
  return [...content.matchAll(patterns.hint)].map((match) => {
    lines = match[0].split("\n");
    return lines
      .map((line) => line.replace(patterns.hintLine, "$1"))
      .join("\n");
  });
}

function processFile(file, baseDir) {
  const content = fs.readFileSync(join(baseDir, file + fileSuffix)).toString();
  const exercise = getExerciseContent(content);
  const solution = getSolutionContent(content);
  const hints = getHints(content);
  return [exercise, solution, hints];
}

function splitFileName(file) {
  const parts = file.split(sep);
  const name = parts.pop();
  const nameParts = name.split(".");
  const pre = nameParts.shift();
  nameParts.pop();
  const path = join(...parts);
  const post = nameParts.map(p => `.${p}`).join("");
  return [path, pre, post];
}

function write(path, filename, content) {
  fs.mkdirSync(path, { recursive: true });
  const file = join(path, filename);
  fs.writeFileSync(file, content);
}

function writeResult(fileName, [ exercise, solution, hints ], dirs) {
  write(dirs.examples, fileName, exercise);
  write(dirs.solutions, fileName, solution);

  const [filePath_, filePre, filePost] = splitFileName(fileName);
  const filePath = join(dirs.hints, filePath_);
  if (hints.length === 1) {
    const file = `${filePre}_hint${filePost}.txt`;
    const hint = `Hint:\n\n${hints[0]}`;
    write(filePath, file, hint);
  } else {
    for (let i = 0; i < hints.length; i++) {
      const file = `${filePre}_hint_${i+1}${filePost}.txt`;
      const hint = `Hint ${i + 1}:\n\n${hints[i]}`;
      write(filePath, file, hint);
    }
  }
}

function processTemplates(baseDir) {
  const dirs = {
    examples: join(baseDir, "out", "exercises"),
    solutions: join(baseDir, "out", "solutions"),
    hints: join(baseDir, "out", "hints"),
  }
  clearDirs(dirs);
  const files = findTemplateFiles(baseDir);
  for (const file of files) {
    const result = processFile(file, baseDir);
    writeResult(file, result, dirs);
  }
}

if (process.argv.length < 2) {
  console.error("Usage: node processTemplates.js <dir>");
  process.exit(1);
}
processTemplates(process.argv[2]);
