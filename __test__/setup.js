const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

dotenvExpand.expand(dotenv.config());

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for tests');
  }
  mongoose.set('useFindAndModify', false);
  mongoose.set('useUnifiedTopology', true);
  await mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    serverSelectionTimeoutMS: 8000,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
