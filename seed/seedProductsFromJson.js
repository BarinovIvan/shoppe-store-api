const fs = require('fs');
const path = require('path');
const Product = require('../model/product');

function normalizeBase(url) {
  return String(url).replace(/\/+$/, '');
}

function applyPublicUrlToImage(image, publicUrl) {
  if (!publicUrl || !image) {
    return image;
  }
  
  try {
    const u = new URL(image);
    return `${normalizeBase(publicUrl)}${u.pathname}${u.search || ''}`;
  } catch {
    return image;
  }
}

module.exports = async function seedProductsFromJson() {
  const seedPath = path.join(__dirname, '..', 'data', 'products.seed.json');
  const raw = fs.readFileSync(seedPath, 'utf8');
  const items = JSON.parse(raw);
  const publicUrl = process.env.PUBLIC_URL;

  const docs = items.map((item) => ({
    ...item,
    image: applyPublicUrlToImage(item.image, publicUrl),
  }));

  await Product.insertMany(docs);

  console.log('products seeded', docs.length);
};
