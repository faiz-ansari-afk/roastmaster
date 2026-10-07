#!/usr/bin/env node
// bin/cli.mjs — Roastmaster CLI: Standup Code Roasting With Zero Mercy
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_ROOT = path.resolve(__dirname, "..");

// ─── ANSI Colors & Formatting ───────────────────────────────────────────────
const isColorSupported =
  process.stdout.isTTY &&
  (!process.env.NO_COLOR || process.env.NO_COLOR === "0");

const color = (code, text) => (isColorSupported ? `\x1b[${code}m${text}\x1b[0m` : text);
const cPink = (t) => color("38;2;244;114;182", t);
const cHotPink = (t) => color("38;2;236;72;153", t);
const cMagenta = (t) => color("38;2;190;24;93", t);
const cCrimson = (t) => color("38;2;225;29;72", t);
const cAmber = (t) => color("38;2;252;211;77", t);
const cCyan = (t) => color("38;2;103;232;249", t);
const cEmerald = (t) => color("38;2;52;211;153", t);
const cDim = (t) => color("2", t);
const cBold = (t) => color("1", t);
const cWhite = (t) => color("97", t);

// ─── ASCII Art Banner ───────────────────────────────────────────────────────
function printBanner() {
  console.log(`
${cHotPink("  ____   ___     _    ____ _____ __  __    _    ____ _____ _____ ____  ")}
${cHotPink(" |  _ \\ / _ \\   / \\  / ___|_   _|  \\/  |  / \\  / ___|_   _| ____|  _ \\ ")}
${cPink(" | |_) | | | | / _ \\ \\___ \\ | | | |\\/| | / _ \\ \\___ \\ | | |  _| | |_) |")}
${cPink(" |  _ <| |_| |/ ___ \\ ___) || | | |  | |/ ___ \\ ___) || | | |___|  _ < ")}
${cMagenta(" |_| \\_\\\\___//_/   \\_\\____/ |_| |_|  |_/_/   \\_\\____/ |_| |_____|_| \\_\\")}
  ${cBold(cCrimson("LIVE DEV STANDUP"))} ${cDim("•")} ${cHotPink("ZERO MERCY CODE CRITIQUE")} ${cDim("•")} ${cAmber("v2.5 CLI")}
`);
}

// ─── Environment Variable Loader ────────────────────────────────────────────
function loadEnv() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), ".env.local"),
    path.join(CLI_ROOT, ".env"),
    path.join(CLI_ROOT, ".env.local"),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {
        // Ignore unreadable env files
      }
    }
  }
}

// ─── Git & Workspace Context Collector ──────────────────────────────────────
function getGitRepoContext() {
  const cwd = process.cwd();
  let isGit = false;
  try {
    const isGitCheck = execSync("git rev-parse --is-inside-work-tree", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    isGit = isGitCheck === "true";
  } catch {
    isGit = false;
  }

  let statusText = "No git repository found";
  let recentCommit = "";
  let gitDiff = "";

  if (isGit) {
    try {
      statusText = execSync("git status --short", {
        cwd,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim();
    } catch {
      statusText = "Clean or detached HEAD";
    }

    try {
      recentCommit = execSync('git log -1 --pretty=format:"%s (%h)"', {
        cwd,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim();
    } catch {
      recentCommit = "No commits yet";
    }

    try {
      gitDiff = execSync("git diff HEAD", {
        cwd,
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 1024 * 1024,
      })
        .toString()
        .trim();
      if (!gitDiff) {
        gitDiff = execSync("git diff --staged", {
          cwd,
          stdio: ["ignore", "pipe", "ignore"],
        })
          .toString()
          .trim();
      }
    } catch {
      gitDiff = "";
    }
  }

  // Inspect package.json if present
  let pkgSummary = "";
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      const scripts = Object.keys(pkg.scripts || {});
      pkgSummary = `Project "${pkg.name || "unnamed"}" v${pkg.version || "0.0.0"}. Dependencies (${deps.length}): [${deps.slice(0, 15).join(", ")}${deps.length > 15 ? "..." : ""}]. DevDependencies (${devDeps.length}): [${devDeps.slice(0, 10).join(", ")}]. Scripts: [${scripts.join(", ")}].`;
    } catch {
      pkgSummary = "package.json is malformed or unreadable";
    }
  }

  // Cap diff size to avoid massive token bloat
  const cappedDiff = gitDiff ? gitDiff.slice(0, 3500) : "No active diff";

  return {
    isGit,
    statusText: statusText || "Clean working tree",
    recentCommit,
    pkgSummary,
    diff: cappedDiff,
  };
}

// ─── File Inspector ─────────────────────────────────────────────────────────
function getFileContext(filePath) {
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absPath)) {
    console.error(cCrimson(`\n❌ Error: File not found: ${filePath}\n`));
    process.exit(1);
  }

  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    console.error(cCrimson(`\n❌ Error: Path is a directory, not a file: ${filePath}\n`));
    process.exit(1);
  }

  const content = fs.readFileSync(absPath, "utf-8");
  const fileName = path.basename(absPath);
  const ext = path.extname(absPath);
  const lines = content.split("\n").length;
  const cappedContent = content.slice(0, 4500);

  return {
    fileName,
    ext,
    lines,
    content: cappedContent,
  };
}

// ─── Roast Engine ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are RoastMaster — a legendary, razor-sharp standup comedian headlining an unfiltered roast comedy club.
The user is sitting in the VIP front row asking a question, sharing code, or showing their repository sins.

CORE COMEDY RULES:
1. SHORT & PUNCHY (STRICT):
   - Deliver exactly 1 to 2 crisp, razor-sharp sentences (strictly under 35-45 words).
   - No long preambles, no monologues. Immediate setup + savage punchline.

2. DIVERSE & 100% UNIQUE JOKES (CRITICAL):
   - NEVER repeat the same joke, metaphor, or punchline across different queries.
   - ABSOLUTELY BANNED: Never use stock clichés like "umbrella in a car wash", "dog chasing tail", or stale internet memes.
   - BANNED OPENINGS: Do NOT start with predictable formulas like "Bhai tu seriously..." or "Matlab tu wahi banda hai...". Start with fresh, dynamic phrasing every turn!
   - Every roast must be 100% tailored specifically to the exact code, dependencies, architecture, or git sins shown.

3. BACKSTAGE REAL TALK:
   - The "suggestion" field must ALWAYS contain "Backstage Real Talk" — clever, constructive, genuinely helpful senior staff architectural advice directly fixing their dilemma.

4. OUTPUT FORMAT:
Always return strictly valid JSON:
{
  "title": "<Concise 3-5 words punchy title, e.g. 'Stripe Nil Error Swallowing', 'React State Death Loop', 'Docker Compose Bloat'>",
  "roast": "1-2 short, razor-sharp punchline sentences specifically roasting their code or git sins",
  "severity": <integer from 1 to 10>,
  "category": "<1-2 words category, e.g. Frontend, Backend, Infra, Git Sins, Security, Logic>",
  "suggestion": "<Backstage Real Talk: clever, constructive, and actually helpful takeaway or fix>"
}
`;

async function generateRoast(promptText) {
  loadEnv();

  const apiKey = process.env.GEMINI_API_KEY;

  // Option A: Direct Google Gemini API
  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);

      const modelsToTry = [
        "gemini-flash-lite-latest",
        "gemini-2.5-flash-lite",
        "gemini-1.5-flash",
      ];

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
              temperature: 0.95,
              topP: 0.9,
              responseMimeType: "application/json",
            },
          });

          const result = await model.generateContent(promptText);
          const responseText = result.response.text();
          let parsed = {};
          try {
            parsed = JSON.parse(responseText);
          } catch {
            const m = responseText.match(/\{[\s\S]*\}/);
            if (m) parsed = JSON.parse(m[0]);
          }

          if (parsed && parsed.roast) {
            return {
              title: parsed.title || "Production Disaster Review",
              roast: parsed.roast,
              severity: typeof parsed.severity === "number" ? parsed.severity : 8.5,
              category: parsed.category || "Codebase Sins",
              suggestion: parsed.suggestion || "Consider taking a break from git push.",
            };
          }
        } catch (err) {
          // Try next model fallback
        }
      }
    } catch {
      // Fallback to local server if generative-ai fails
    }
  }

  // Option B: Fallback to deployed Roastmaster API or local Next.js dev server
  const endpoints = [
    "https://roastmaster-phi.vercel.app/api/chat",
    "http://localhost:3000/api/chat",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }],
          sessionId: "cli-roast-" + Date.now(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return {
          title: json.title || "Standup Roast",
          roast: json.roast || json.content || "Code looking like a Monday morning commit.",
          severity: typeof json.severity === "number" ? json.severity : 8.0,
          category: json.category || "General",
          suggestion: json.suggestion || "Refactor before production sees this.",
        };
      }
    } catch {
      // Continue to next endpoint
    }
  }

  if (!apiKey) {
    console.log(
      cCrimson("\n❌ Unable to reach Roastmaster brain.") +
        "\n" +
        cDim("Please set your Gemini API key:") +
        `\n  ${cAmber('export GEMINI_API_KEY="your-gemini-key"')}` +
        `\n  ${cDim("or add it to your .env file in this directory.")}` +
        `\n  ${cDim("or visit the live web stage at https://roastmaster-phi.vercel.app/chat")}\n`
    );
    process.exit(1);
  }

  throw new Error("Unable to generate roast. Check your network connection or API key.");
}

// ─── Terminal Box Formatter ─────────────────────────────────────────────────
function wrapText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + (currentLine ? " " : "") + word).length <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function renderTerminalCard({ title, roast, severity, category, suggestion }) {
  const terminalWidth = Math.min(process.stdout.columns || 80, 80);
  const innerWidth = terminalWidth - 4;

  const topBorder = cPink("╭" + "─".repeat(terminalWidth - 2) + "╮");
  const midBorder = cPink("├" + "─".repeat(terminalWidth - 2) + "┤");
  const bottomBorder = cPink("╰" + "─".repeat(terminalWidth - 2) + "╯");

  // Severity progress bar
  const numBlocks = Math.round(Math.min(10, Math.max(1, severity)));
  const bar =
    cCrimson("█".repeat(numBlocks)) +
    cDim("░".repeat(Math.max(0, 10 - numBlocks)));

  console.log("\n" + topBorder);

  // Title header
  const titleLine = ` 🎙️  ${cBold(cWhite(title.toUpperCase()))}`;
  console.log(
    cPink("│") +
      " " +
      titleLine +
      " ".repeat(Math.max(0, innerWidth - (title.length + 6))) +
      " " +
      cPink("│")
  );

  // Meta line
  const metaText = `Category: ${category}  •  Severity: [${numBlocks}/10]`;
  console.log(
    cPink("│") +
      `  ${cCyan("🏷️  " + category)}  ${cDim("•")}  ${cCrimson("🔥 " + bar)} ${cBold(cCrimson(severity + "/10"))}` +
      " ".repeat(Math.max(0, innerWidth - (metaText.length + 15))) +
      cPink("│")
  );

  console.log(midBorder);

  // Empty padding line
  console.log(cPink("│") + " ".repeat(terminalWidth - 2) + cPink("│"));

  // Savage Roast Lines
  const roastLines = wrapText(`“${roast}”`, innerWidth - 4);
  for (const line of roastLines) {
    console.log(
      cPink("│") +
        "  " +
        cBold(cWhite(line)) +
        " ".repeat(Math.max(0, innerWidth - line.length - 2)) +
        cPink("│")
    );
  }

  console.log(cPink("│") + " ".repeat(terminalWidth - 2) + cPink("│"));
  console.log(midBorder);

  // Backstage Real Talk
  console.log(
    cPink("│") +
      `  ${cAmber(cBold("💡 BACKSTAGE REAL TALK (CONSTRUCTIVE FIX):"))}` +
      " ".repeat(Math.max(0, innerWidth - 42)) +
      cPink("│")
  );

  const suggestionLines = wrapText(suggestion, innerWidth - 4);
  for (const line of suggestionLines) {
    console.log(
      cPink("│") +
        "  " +
        cEmerald(line) +
        " ".repeat(Math.max(0, innerWidth - line.length - 2)) +
        cPink("│")
    );
  }

  console.log(cPink("│") + " ".repeat(terminalWidth - 2) + cPink("│"));
  console.log(bottomBorder);

  console.log(
    `\n  ${cDim("✨ Web Stage:")} ${cHotPink("https://roastmaster-phi.vercel.app/chat")}  ${cDim("•")}  ${cDim("Roastmaster CLI v2.5")}\n`
  );
}

// ─── Animated Terminal Spinner ──────────────────────────────────────────────
async function withSpinner(taskPromise, message = "Analyzing your code sins...") {
  if (!process.stdout.isTTY) {
    console.log(`[✦] ${message}`);
    return await taskPromise;
  }

  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(
      `\r${cHotPink(frames[i++ % frames.length])} ${cBold(message)} `
    );
  }, 80);

  try {
    const result = await taskPromise;
    clearInterval(interval);
    process.stdout.write("\r\x1b[2K"); // Clear line
    return result;
  } catch (err) {
    clearInterval(interval);
    process.stdout.write("\r\x1b[2K");
    throw err;
  }
}

// ─── Help Manual ────────────────────────────────────────────────────────────
function printHelp() {
  printBanner();
  console.log(`
${cBold("USAGE:")}
  ${cHotPink("npx roastmaster")} ${cDim("[options]")}
  ${cHotPink("npx roastmaster-ai")} ${cCyan("--roast-repo")}
  ${cHotPink("roastmaster")} ${cCyan("-f")} ${cWhite("src/components/App.tsx")}

${cBold("COMMANDS & FLAGS:")}
  ${cCyan("-r, --roast-repo")}         Inspect git status, recent commit, and package.json to roast repository
  ${cCyan("-d, --diff")}               Roast uncommitted/staged git diff changes before pushing
  ${cCyan("-f, --file <path>")}        Roast a specific code file directly
  ${cCyan("-h, --help")}               Show this comedy manual and exit

${cBold("EXAMPLES:")}
  ${cDim("# Roast the current repository")}
  ${cWhite("$ npx roastmaster --roast-repo")}

  ${cDim("# Roast your pending git diff before code review")}
  ${cWhite("$ npx roastmaster --diff")}

  ${cDim("# Roast a suspicious frontend component")}
  ${cWhite("$ npx roastmaster -f src/app/page.jsx")}

  ${cDim("# Quick freestyle query")}
  ${cWhite("$ npx roastmaster \"I store plain text JWTs in localStorage\"")}
`);
}

// ─── Main CLI Dispatcher ────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    return;
  }

  printBanner();

  let prompt = "";
  const isRoastRepo = args.includes("-r") || args.includes("--roast-repo");
  const isDiffOnly = args.includes("-d") || args.includes("--diff");
  const fileFlagIdx = args.findIndex((a) => a === "-f" || a === "--file");

  if (fileFlagIdx !== -1 && args[fileFlagIdx + 1]) {
    const targetFile = args[fileFlagIdx + 1];
    const fileData = getFileContext(targetFile);
    console.log(
      `  ${cCyan("📂 Inspecting file:")} ${cBold(fileData.fileName)} (${fileData.lines} lines)`
    );
    prompt = `Please roast this code file "${fileData.fileName}":\n\`\`\`${fileData.ext.slice(1)}\n${fileData.content}\n\`\`\``;
  } else if (isDiffOnly) {
    const repo = getGitRepoContext();
    if (!repo.diff || repo.diff === "No active diff") {
      console.log(
        cAmber("  ℹ️  No uncommitted git diff found. Working directory is clean!\n")
      );
      prompt = `Roast this developer: their git status is clean, recent commit is "${repo.recentCommit}". Roast their lack of courage to break production.`;
    } else {
      console.log(
        `  ${cCyan("🔍 Analyzing Git Diff:")} ${cBold(repo.statusText.split("\n").length + " files touched")}`
      );
      prompt = `Please roast this uncommitted git diff:\n\`\`\`diff\n${repo.diff}\n\`\`\``;
    }
  } else if (isRoastRepo || args.length === 0) {
    const repo = getGitRepoContext();
    console.log(`  ${cCyan("📦 Scanning Repository Context...")}`);
    if (repo.pkgSummary) console.log(`  ${cDim(repo.pkgSummary)}`);
    if (repo.recentCommit) console.log(`  ${cDim("Recent commit: " + repo.recentCommit)}`);

    prompt = `Please roast this repository setup:
${repo.pkgSummary}
Git Status:
${repo.statusText}
Recent Commit:
${repo.recentCommit}
Active Code Changes:
${repo.diff}`;
  } else {
    // Custom inline argument
    const customQuery = args.join(" ");
    console.log(`  ${cCyan("🎯 Topic:")} "${customQuery}"`);
    prompt = `Please roast this question/code from the user: "${customQuery}"`;
  }

  try {
    const roastResult = await withSpinner(
      generateRoast(prompt),
      "Roastmaster analyzing your code sins with zero mercy..."
    );

    renderTerminalCard(roastResult);
  } catch (error) {
    console.error(
      cCrimson("\n❌ Failed to generate roast: ") +
        cDim(error?.message || String(error)) +
        "\n"
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
