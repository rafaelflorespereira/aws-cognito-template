#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const ts = require("typescript");

const APP_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(APP_ROOT, ".env");
const TRANSLATIONS_PATH = path.join(
  APP_ROOT,
  "src/features/i18n/translations.ts",
);
const AUDIO_ROOT = path.join(APP_ROOT, "assets/audio/maneuvers");
const MANIFEST_PATH = path.join(__dirname, "maneuver-audio-manifest.json");
const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";

function loadLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    return;
  }

  for (const rawLine of fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }

    let value = match[2].trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

const MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const VOICE = process.env.OPENAI_TTS_VOICE || "marin";
const FORMAT = "mp3";
const INSTRUCTION_VERSION = 2;
const MANEUVER_NUMBERS = [1, 2, 3, 4, 5, 6];
const LANGUAGE_NAMES = {
  en: "English",
  pt: "Brazilian Portuguese",
  es: "Spanish",
  fr: "French",
  it: "Italian",
};

const args = new Set(process.argv.slice(2));
for (const arg of args) {
  if (arg !== "--check" && arg !== "--force") {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const checkOnly = args.has("--check");
const force = args.has("--force");
if (checkOnly && force) {
  throw new Error("--check and --force cannot be used together");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function instructionFor(lang) {
  const language = LANGUAGE_NAMES[lang];
  if (!language) {
    throw new Error(`No narration instructions configured for language: ${lang}`);
  }

  return [
    `Speak in ${language} with native pronunciation.`,
    "Use a soft, smooth, deeply relaxing meditation-guide tone.",
    "Speak at an unhurried, even pace with gentle warmth, low energy, and rounded intonation.",
    "Leave comfortable pauses between sentences while keeping each instruction fluid.",
    "Avoid urgency, upbeat inflection, dramatic emphasis, harsh delivery, whispering, or audible breaths.",
    "Do not paraphrase or add introductory words; read every supplied word exactly once.",
  ].join(" ");
}

function loadTranslations() {
  const source = fs.readFileSync(TRANSLATIONS_PATH, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: TRANSLATIONS_PATH,
    reportDiagnostics: true,
  });

  if (output.diagnostics?.length) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(output.diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => APP_ROOT,
      getNewLine: () => "\n",
    });
    throw new Error(`Could not compile translations:\n${formatted}`);
  }

  const compiledModule = { exports: {} };
  const execute = new Function(
    "exports",
    "module",
    "require",
    "__filename",
    "__dirname",
    output.outputText,
  );
  execute(
    compiledModule.exports,
    compiledModule,
    require,
    TRANSLATIONS_PATH,
    path.dirname(TRANSLATIONS_PATH),
  );

  return compiledModule.exports;
}

function buildClips(supportedLangs, translations) {
  return supportedLangs.flatMap((lang) =>
    MANEUVER_NUMBERS.map((maneuver) => {
      const translationKey = `maneuver.${maneuver}.text`;
      const text = translations[lang]?.[translationKey];
      if (typeof text !== "string" || !text.trim()) {
        throw new Error(`Missing translation: ${lang}.${translationKey}`);
      }

      return {
        key: `${lang}/${maneuver}`,
        lang,
        maneuver,
        text,
        textSha256: sha256(text),
        relativeFile: `${lang}/${maneuver}.${FORMAT}`,
        outputFile: path.join(AUDIO_ROOT, lang, `${maneuver}.${FORMAT}`),
      };
    }),
  );
}

function currentGeneration() {
  const instructions = Object.fromEntries(
    Object.keys(LANGUAGE_NAMES).map((lang) => [lang, instructionFor(lang)]),
  );
  const generationHash = sha256(
    JSON.stringify({
      provider: "openai",
      model: MODEL,
      voice: VOICE,
      format: FORMAT,
      instructionVersion: INSTRUCTION_VERSION,
      instructions,
    }),
  );

  return {
    provider: "openai",
    model: MODEL,
    voice: VOICE,
    format: FORMAT,
    instructionVersion: INSTRUCTION_VERSION,
    generationHash,
  };
}

async function readManifest() {
  try {
    const raw = await fsp.readFile(MANIFEST_PATH, "utf8");
    const manifest = JSON.parse(raw);
    if (!manifest || typeof manifest !== "object") {
      throw new Error("manifest root must be an object");
    }
    return manifest;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw new Error(`Could not read ${MANIFEST_PATH}: ${error.message}`);
  }
}

async function writeFileAtomic(filePath, contents) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  try {
    await fsp.writeFile(temporaryPath, contents);
    await fsp.rename(temporaryPath, filePath);
  } catch (error) {
    await fsp.rm(temporaryPath, { force: true });
    throw error;
  }
}

async function writeManifest(manifest) {
  manifest.updatedAt = new Date().toISOString();
  await writeFileAtomic(
    MANIFEST_PATH,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function isValidMp3(filePath) {
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile() || stat.size < 1_000) {
      return false;
    }

    const handle = await fsp.open(filePath, "r");
    try {
      const header = Buffer.alloc(3);
      await handle.read(header, 0, header.length, 0);
      return (
        header.toString("ascii") === "ID3" ||
        (header[0] === 0xff && (header[1] & 0xe0) === 0xe0)
      );
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function checkAssets(manifest, clips, expectedGeneration) {
  const failures = [];

  if (!manifest) {
    failures.push("generation manifest is missing");
  } else {
    if (manifest.pendingGeneration) {
      failures.push("a narration generation run did not complete");
    }
    if (!manifest.generationHash) {
      failures.push("manifest generation hash is missing");
    }
    if (manifest.generationHash !== expectedGeneration.generationHash) {
      failures.push(
        `generation settings changed; regenerate with ${expectedGeneration.model}/${expectedGeneration.voice}`,
      );
    }
  }

  for (const clip of clips) {
    const entry = manifest?.clips?.[clip.key];
    if (!entry) {
      failures.push(`${clip.key}: manifest entry is missing`);
      continue;
    }
    if (entry.textSha256 !== clip.textSha256) {
      failures.push(`${clip.key}: source text changed; regenerate this clip`);
    }
    if (entry.generationHash !== manifest.generationHash) {
      failures.push(`${clip.key}: clip was generated with different settings`);
    }
    if (!(await isValidMp3(clip.outputFile))) {
      failures.push(`${clip.key}: MP3 file is missing or invalid`);
    }
  }

  if (failures.length) {
    throw new Error(
      `Static narration check failed:\n${failures
        .map((failure) => `- ${failure}`)
        .join("\n")}`,
    );
  }

  console.log(`Validated ${clips.length} static narration clips.`);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function synthesizeClip(apiKey, clip) {
  const requestBody = JSON.stringify({
    model: MODEL,
    voice: VOICE,
    input: clip.text,
    instructions: instructionFor(clip.lang),
    response_format: FORMAT,
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response;
    try {
      response = await fetch(OPENAI_SPEECH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
        signal: AbortSignal.timeout(120_000),
      });
    } catch (error) {
      if (attempt === 3) {
        throw new Error(
          `${clip.key}: OpenAI speech request failed after ${attempt} attempts: ${error.message}`,
        );
      }
      await delay(attempt * 1_000);
      continue;
    }

    if (response.ok) {
      const audio = Buffer.from(await response.arrayBuffer());
      const temporaryPath = `${clip.outputFile}.response-${process.pid}`;
      await writeFileAtomic(temporaryPath, audio);
      const valid = await isValidMp3(temporaryPath);
      await fsp.rm(temporaryPath, { force: true });
      if (!valid) {
        throw new Error(`${clip.key}: OpenAI returned an invalid MP3 response`);
      }
      return audio;
    }

    const detail = (await response.text()).trim().slice(0, 800);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 3) {
      throw new Error(
        `${clip.key}: OpenAI speech request failed (${response.status})${
          detail ? `: ${detail}` : ""
        }`,
      );
    }

    console.warn(
      `${clip.key}: OpenAI returned ${response.status}; retrying (${attempt}/3).`,
    );
    await delay(attempt * 1_000);
  }

  throw new Error(`${clip.key}: OpenAI speech request did not complete`);
}

async function main() {
  const { SUPPORTED_LANGS, translations } = loadTranslations();
  const clips = buildClips(SUPPORTED_LANGS, translations);
  const generation = currentGeneration();
  const existingManifest = await readManifest();

  if (checkOnly) {
    await checkAssets(existingManifest, clips, generation);
    return;
  }

  const manifest = {
    version: 1,
    provider: existingManifest?.provider ?? generation.provider,
    model: existingManifest?.model ?? generation.model,
    voice: existingManifest?.voice ?? generation.voice,
    format: existingManifest?.format ?? generation.format,
    instructionVersion:
      existingManifest?.instructionVersion ?? generation.instructionVersion,
    generationHash: existingManifest?.generationHash ?? null,
    clips:
      existingManifest?.clips && typeof existingManifest.clips === "object"
        ? existingManifest.clips
        : {},
  };

  const clipsToGenerate = [];
  for (const clip of clips) {
    const entry = manifest.clips[clip.key];
    const current =
      !force &&
      entry?.textSha256 === clip.textSha256 &&
      entry?.generationHash === generation.generationHash &&
      (await isValidMp3(clip.outputFile));
    if (!current) {
      clipsToGenerate.push(clip);
    }
  }

  const alreadyFinal =
    clipsToGenerate.length === 0 &&
    !manifest.pendingGeneration &&
    manifest.generationHash === generation.generationHash;
  if (alreadyFinal) {
    await checkAssets(manifest, clips, generation);
    console.log("All narration clips are already current.");
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_OPEN_API;
  if (clipsToGenerate.length && !apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required to generate narration. The existing EXPO_OPEN_API alias is also supported.",
    );
  }

  manifest.pendingGeneration = generation;
  await writeManifest(manifest);

  for (const clip of clipsToGenerate) {
    console.log(`Generating ${clip.key} with ${MODEL}/${VOICE}...`);
    const audio = await synthesizeClip(apiKey, clip);
    await writeFileAtomic(clip.outputFile, audio);
    manifest.clips[clip.key] = {
      file: clip.relativeFile,
      textSha256: clip.textSha256,
      generationHash: generation.generationHash,
      generatedAt: new Date().toISOString(),
    };
    await writeManifest(manifest);
  }

  manifest.provider = generation.provider;
  manifest.model = generation.model;
  manifest.voice = generation.voice;
  manifest.format = generation.format;
  manifest.instructionVersion = generation.instructionVersion;
  manifest.generationHash = generation.generationHash;
  delete manifest.pendingGeneration;
  await writeManifest(manifest);
  await checkAssets(manifest, clips, generation);

  console.log(
    clipsToGenerate.length
      ? `Generated ${clipsToGenerate.length} narration clips.`
      : "All narration clips are already current.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
