const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const Product = require('../model/product');

const IMG_SUBDIRS = ['bars', 'chains', 'coins', 'earrings', 'rings'];
const CATEGORY_BY_DIR = {
  bars: 'bars',
  chains: 'chains',
  coins: 'coins',
  earrings: 'earrings',
  rings: 'rings',
};
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const RUB_PER_USD_DEFAULT = 100;
const DEFAULT_DUMP_PATH = path.join(__dirname, '..', 'data', 'products.seed.json');
const DUMP_PUBLIC_URL_FALLBACK = 'http://localhost:6400';

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const myEnv = dotenv.config({ path: envPath });
  dotenvExpand.expand(myEnv);
}

function normalizePublicUrl(url) {
  return String(url).replace(/\/+$/, '');
}

function rubPerUsd() {
  const n = Number(process.env.RUB_PER_USD);
  return Number.isFinite(n) && n > 0 ? n : RUB_PER_USD_DEFAULT;
}

function priceUsdFromRub(rub) {
  const r = Number(rub);
  if (!Number.isFinite(r)) {
    return 0;
  }
  const usd = r / rubPerUsd();
  return Math.round(usd * 100) / 100;
}

function listRequestJsonFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && /^request\d*\.json$/i.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

function buildSlugToItemMap(dir) {
  const map = new Map();
  const names = listRequestJsonFiles(dir);
  for (const name of names) {
    const full = path.join(dir, name);
    const raw = fs.readFileSync(full, 'utf8');
    const data = JSON.parse(raw);
    const items = data.products && Array.isArray(data.products.items) ? data.products.items : [];
    for (const item of items) {
      if (item && typeof item.slug === 'string' && item.slug.length > 0) {
        const prev = map.get(item.slug);
        if (prev && prev.id !== item.id) {
          process.stderr.write(
            `duplicate slug "${item.slug}" in ${dir}: ids ${prev.id} vs ${item.id} (${name} wins)\n`
          );
        }
        map.set(item.slug, item);
      }
    }
  }
  return map;
}

function listImageBasenames(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && IMAGE_EXT.test(e.name))
    .map((e) => e.name);
}

function imageUrl(baseUrl, dirName, fileName) {
  return `${baseUrl}/img/${dirName}/${encodeURIComponent(fileName)}`;
}

function replaceAllRequested() {
  if (process.argv.includes('--replace-all')) {
    return true;
  }
  const v = process.env.SEED_REPLACE_ALL;
  return v === '1' || /^true$/i.test(String(v));
}

function parseDumpArg() {
  const idx = process.argv.indexOf('--dump');
  if (idx === -1) {
    return null;
  }
  const next = process.argv[idx + 1];
  if (next && !next.startsWith('-')) {
    return path.isAbsolute(next) ? next : path.join(process.cwd(), next);
  }
  return DEFAULT_DUMP_PATH;
}

function resolvePublicUrlForDump() {
  const raw = process.env.PUBLIC_URL;
  if (raw) {
    return normalizePublicUrl(raw);
  }
  process.stderr.write(
    `PUBLIC_URL unset; using ${DUMP_PUBLIC_URL_FALLBACK} for image URLs in dump (set PUBLIC_URL to override)\n`
  );
  return DUMP_PUBLIC_URL_FALLBACK;
}

function collectProductDocuments(publicUrl, imgRoot) {
  let imagesSeen = 0;
  let missingJson = 0;
  const missingJsonSamples = [];
  const documents = [];
  const seenIds = new Set();

  for (const dirName of IMG_SUBDIRS) {
    const dirPath = path.join(imgRoot, dirName);
    if (!fs.existsSync(dirPath)) {
      process.stderr.write(`skip missing folder: ${dirPath}\n`);
      continue;
    }
    const category = CATEGORY_BY_DIR[dirName];
    const slugMap = buildSlugToItemMap(dirPath);
    const files = listImageBasenames(dirPath);
    for (const fileName of files) {
      imagesSeen += 1;
      const slug = fileName.replace(IMAGE_EXT, '');
      const item = slugMap.get(slug);
      if (!item) {
        missingJson += 1;
        if (missingJsonSamples.length < 20) {
          missingJsonSamples.push(`${dirName}/${fileName}`);
        }
        continue;
      }
      const id = item.id;
      if (seenIds.has(id)) {
        process.stderr.write(`skip duplicate id ${id} (${dirName}/${fileName})\n`);
        continue;
      }
      seenIds.add(id);
      let title = typeof item.name === 'string' ? item.name : '';
      if (!title) {
        title = slug;
      }
      const description =
        typeof item.description === 'string'
          ? item.description
          : item.description == null
            ? ''
            : String(item.description);
      const rub = item.price && item.price.price != null ? item.price.price : 0;
      const price = priceUsdFromRub(rub);
      const image = imageUrl(publicUrl, dirName, fileName);
      documents.push({
        id,
        title,
        price,
        description,
        image,
        category,
      });
    }
  }

  return {
    documents,
    stats: {
      imagesSeen,
      missingJson,
      missingJsonSamples,
      documentCount: documents.length,
    },
  };
}

async function runDump(dumpPath) {
  loadEnv();
  const publicUrl = resolvePublicUrlForDump();
  const imgRoot = path.join(__dirname, '..', 'public', 'img');
  const { documents, stats } = collectProductDocuments(publicUrl, imgRoot);
  const dir = path.dirname(dumpPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dumpPath, JSON.stringify(documents, null, 2), 'utf8');
  process.stdout.write(
    JSON.stringify(
      {
        mode: 'dump',
        dumpPath,
        publicUrl,
        ...stats,
      },
      null,
      2
    ) + '\n'
  );
}

async function runSeed() {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL;
  const publicUrlRaw = process.env.PUBLIC_URL;
  if (!databaseUrl) {
    process.stderr.write('DATABASE_URL is required\n');
    process.exit(1);
  }
  if (!publicUrlRaw) {
    process.stderr.write('PUBLIC_URL is required (e.g. https://example.com)\n');
    process.exit(1);
  }
  const publicUrl = normalizePublicUrl(publicUrlRaw);
  const imgRoot = path.join(__dirname, '..', 'public', 'img');
  const replaceAll = replaceAllRequested();

  mongoose.set('useFindAndModify', false);
  mongoose.set('useUnifiedTopology', true);
  await mongoose.connect(databaseUrl, { useNewUrlParser: true });

  if (replaceAll) {
    await Product.deleteMany({});
    process.stdout.write('products collection cleared (--replace-all)\n');
  }

  const { documents, stats } = collectProductDocuments(publicUrl, imgRoot);
  let created = 0;
  let skippedExisting = 0;

  for (const doc of documents) {
    if (!replaceAll) {
      const exists = await Product.findOne({ id: doc.id }).select('_id').lean();
      if (exists) {
        skippedExisting += 1;
        continue;
      }
    }
    await Product.create(doc);
    created += 1;
  }

  await mongoose.disconnect();

  process.stdout.write(
    JSON.stringify(
      {
        mode: 'seed',
        imagesSeen: stats.imagesSeen,
        created,
        skippedExisting,
        missingJson: stats.missingJson,
        missingJsonSamples: stats.missingJsonSamples,
        replaceAll,
      },
      null,
      2
    ) + '\n'
  );
}

async function main() {
  const dumpPath = parseDumpArg();
  if (dumpPath) {
    await runDump(dumpPath);
    return;
  }
  await runSeed();
}

main().catch((err) => {
  process.stderr.write(String(err && err.stack ? err.stack : err) + '\n');
  mongoose.disconnect().finally(() => process.exit(1));
});
