import { chmod, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , bundleArg = 'project.bundle.mjs', outputArg = 'restored-project', forceArg] = process.argv;
const root = process.cwd();
const bundlePath = path.resolve(root, bundleArg);
const outputRoot = path.resolve(root, outputArg);
const force = forceArg === '--force';

async function ensureEmptyOrForced(directory) {
  try {
    const entries = await readdir(directory);
    if (entries.length > 0 && !force) {
      throw new Error(`Output directory is not empty: ${directory}. Pass --force to overwrite files.`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function resolveSafeTarget(relativePath) {
  const normalized = path.normalize(relativePath);
  if (path.isAbsolute(normalized) || normalized.startsWith('..')) {
    throw new Error(`Unsafe bundle path: ${relativePath}`);
  }

  const target = path.resolve(outputRoot, normalized);
  if (!target.startsWith(outputRoot + path.sep) && target !== outputRoot) {
    throw new Error(`Unsafe restore target: ${relativePath}`);
  }

  return target;
}

const module = await import(pathToFileURL(bundlePath).href);
const { projectBundle } = module;

if (!projectBundle || !Array.isArray(projectBundle.files)) {
  throw new Error(`Invalid project bundle: ${bundlePath}`);
}

await ensureEmptyOrForced(outputRoot);

for (const file of projectBundle.files) {
  const target = resolveSafeTarget(file.path);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(file.content, file.encoding));
  if (typeof file.mode === 'number') {
    await chmod(target, file.mode);
  }
}

console.log(`Restored ${projectBundle.files.length} files to ${outputRoot}`);
