import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const assistantRoot = path.resolve(toolDirectory, '..');
const sourceDirectory = path.join(assistantRoot, 'src');
const manifestPath = path.join(sourceDirectory, 'knowledge-verification.json');
const sourceFiles = [
  'knowledge-base.json',
  'product-knowledge.json',
  'product-knowledge-index.json',
  'video-guide-catalog.json',
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function canonicalJsonHash(fileName) {
  const value = readJson(path.join(sourceDirectory, fileName));
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function currentSnapshot(verifiedAt) {
  const productKnowledge = readJson(path.join(sourceDirectory, 'product-knowledge.json'));
  const productIndex = readJson(path.join(sourceDirectory, 'product-knowledge-index.json'));
  const videoCatalog = readJson(path.join(sourceDirectory, 'video-guide-catalog.json'));
  return {
    schemaVersion: 1,
    verifiedAt,
    sourceVersions: {
      productKnowledge: productKnowledge.version,
      productKnowledgeIndex: productIndex.sourceVersion,
      videoGuideCatalog: String(videoCatalog.version),
    },
    sources: Object.fromEntries(sourceFiles.map((fileName) => [fileName, canonicalJsonHash(fileName)])),
  };
}

function replaceTopLevelVersion(fileName, field, value) {
  const filePath = path.join(sourceDirectory, fileName);
  const input = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(`^(\\s*"${field}"\\s*:\\s*")[^"]+("\\s*,?)`, 'm');
  if (!pattern.test(input)) throw new Error(`${fileName}: ${field} field is missing`);
  fs.writeFileSync(filePath, input.replace(pattern, `$1${value}$2`), 'utf8');
}

export function verifyKnowledgeSnapshot(manifest = readJson(manifestPath)) {
  const expected = currentSnapshot(manifest.verifiedAt);
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.verifiedAt || '')) {
    errors.push('knowledge verification date must use YYYY-MM-DD');
  }
  if (JSON.stringify(manifest.sourceVersions) !== JSON.stringify(expected.sourceVersions)) {
    errors.push('knowledge source versions do not match the verification manifest');
  }
  for (const fileName of sourceFiles) {
    if (manifest.sources?.[fileName] !== expected.sources[fileName]) {
      errors.push(`${fileName} changed after the recorded verification`);
    }
  }
  return errors;
}

function refreshKnowledgeSnapshot(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must use YYYY-MM-DD');
  replaceTopLevelVersion('product-knowledge.json', 'version', date);
  replaceTopLevelVersion('product-knowledge-index.json', 'sourceVersion', date);
  fs.writeFileSync(manifestPath, `${JSON.stringify(currentSnapshot(date), null, 2)}\n`, 'utf8');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2] || '--check';
  if (command === '--refresh') {
    const dateIndex = process.argv.indexOf('--date');
    const date = dateIndex >= 0 ? process.argv[dateIndex + 1] : new Date().toISOString().slice(0, 10);
    refreshKnowledgeSnapshot(date);
    console.log(`Knowledge verification refreshed for ${date}.`);
  } else if (command === '--check') {
    const errors = verifyKnowledgeSnapshot();
    if (errors.length) {
      console.error(errors.join('\n'));
      console.error('Review the source changes, then run npm run knowledge:refresh.');
      process.exitCode = 1;
    } else {
      console.log('Knowledge verification snapshot is current.');
    }
  } else {
    throw new Error(`unknown command: ${command}`);
  }
}
