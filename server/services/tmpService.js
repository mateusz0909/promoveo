const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const BASE_TMP_DIR = path.resolve(__dirname, '..', 'tmp');
const DEFAULT_MAX_FILE_AGE_HOURS = Number(process.env.TMP_MAX_FILE_AGE_HOURS || 3);
const DEFAULT_CLEANUP_INTERVAL_MINUTES = Number(process.env.TMP_CLEANUP_INTERVAL_MINUTES || 60);

function toMilliseconds({ hours, minutes }) {
  if (typeof hours === 'number' && !Number.isNaN(hours)) {
    return Math.max(hours, 0) * 60 * 60 * 1000;
  }
  if (typeof minutes === 'number' && !Number.isNaN(minutes)) {
    return Math.max(minutes, 0) * 60 * 1000;
  }
  return undefined;
}

function ensureTmpDirSync() {
  fs.mkdirSync(BASE_TMP_DIR, { recursive: true });
  return BASE_TMP_DIR;
}

async function ensureTmpDir() {
  await fsp.mkdir(BASE_TMP_DIR, { recursive: true });
  return BASE_TMP_DIR;
}

function getTmpDirPath(...segments) {
  return path.join(BASE_TMP_DIR, ...segments);
}

function normalizeToTmp(targetPath) {
  if (!targetPath) return null;
  const absolutePath = path.isAbsolute(targetPath)
    ? targetPath
    : path.join(BASE_TMP_DIR, targetPath);
  const normalized = path.resolve(absolutePath);
  if (!normalized.startsWith(BASE_TMP_DIR)) {
    throw new Error(`tmpService: Refusing to operate on path outside tmp directory: ${targetPath}`);
  }
  return normalized;
}

async function writeBufferToTmp(buffer, { prefix = 'file', extension = '', subdir = '' } = {}) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('tmpService.writeBufferToTmp expects a Buffer instance');
  }

  await ensureTmpDir();
  const safeExtension = extension
    ? extension.startsWith('.') ? extension : `.${extension}`
    : '';
  const fileName = `${prefix}-${Date.now()}-${randomUUID()}${safeExtension}`;
  const relativePath = path.join(subdir, fileName);
  const absolutePath = path.join(BASE_TMP_DIR, relativePath);

  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsp.writeFile(absolutePath, buffer);

  return {
    absolutePath,
    relativePath,
    publicPath: `/static/${relativePath.split(path.sep).join('/')}`
  };
}

async function removeEntry(targetPath) {
  const normalized = normalizeToTmp(targetPath);
  if (!normalized) return false;
  try {
    await fsp.rm(normalized, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.warn(`tmpService: Failed to remove ${normalized}:`, error);
    return false;
  }
}

async function sweepDirectory(directory, maxFileAgeMs, dryRun, removedEntries) {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  const now = Date.now();

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    try {
      const stats = await fsp.stat(fullPath);
      const ageMs = now - stats.mtimeMs;

      if (entry.isDirectory()) {
        await sweepDirectory(fullPath, maxFileAgeMs, dryRun, removedEntries);

        const isEmpty = (await fsp.readdir(fullPath)).length === 0;
        if ((isEmpty || ageMs > maxFileAgeMs) && ageMs > maxFileAgeMs) {
          if (!dryRun) {
            await fsp.rm(fullPath, { recursive: true, force: true });
          }
          removedEntries.push({ path: fullPath, type: 'directory', ageMs });
        }
      } else if (ageMs > maxFileAgeMs) {
        if (!dryRun) {
          await fsp.rm(fullPath, { force: true });
        }
        removedEntries.push({ path: fullPath, type: 'file', ageMs });
      }
    } catch (error) {
      console.warn(`tmpService: Failed to process ${fullPath}:`, error);
    }
  }
}

async function cleanTmpDir({
  maxFileAgeMs,
  maxFileAgeHours,
  dryRun = false,
  log = true
} = {}) {
  await ensureTmpDir();

  const effectiveMaxFileAgeMs = maxFileAgeMs
    || toMilliseconds({ hours: maxFileAgeHours })
    || toMilliseconds({ hours: DEFAULT_MAX_FILE_AGE_HOURS })
    || 24 * 60 * 60 * 1000;

  const removedEntries = [];
  await sweepDirectory(BASE_TMP_DIR, effectiveMaxFileAgeMs, dryRun, removedEntries);

  if (log && removedEntries.length > 0) {
    console.log(`tmpService: Removed ${removedEntries.length} expired item(s) from tmp directory.`);
  }

  return removedEntries;
}

let cleanupTimer = null;

function scheduleTmpCleanup({ intervalMinutes, maxFileAgeHours } = {}) {
  const effectiveIntervalMinutes = intervalMinutes
    || DEFAULT_CLEANUP_INTERVAL_MINUTES;
  const intervalMs = toMilliseconds({ minutes: effectiveIntervalMinutes }) || (60 * 60 * 1000);

  const cleanupOptions = {
    maxFileAgeHours: maxFileAgeHours || DEFAULT_MAX_FILE_AGE_HOURS
  };

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }

  cleanupTimer = setInterval(() => {
    cleanTmpDir({ ...cleanupOptions }).catch(error => {
      console.error('tmpService: Scheduled cleanup failed:', error);
    });
  }, intervalMs);

  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  return cleanupTimer;
}

module.exports = {
  BASE_TMP_DIR,
  ensureTmpDir,
  ensureTmpDirSync,
  getTmpDirPath,
  writeBufferToTmp,
  removeEntry,
  cleanTmpDir,
  scheduleTmpCleanup,
  normalizeToTmp
};
