const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const productRoute = require('./routes/product');
const homeRoute = require('./routes/home');
const cartRoute = require('./routes/cart');
const userRoute = require('./routes/user');
const authRoute = require('./routes/auth');
const accessCookie = require('./middleware/accessCookie');
const Product = require('./model/product');
const seedProductsFromJson = require('./seed/seedProductsFromJson');

const app = express();
const port = Number(process.env.PORT) || 80;

app.use(cors());
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(accessCookie);
app.set('view engine', 'ejs');
app.set('views', 'views');
app.disable('view cache');
app.use('/', homeRoute);
app.use('/products', productRoute);
app.use('/carts', cartRoute);
app.use('/users', userRoute);
app.use('/auth', authRoute);

module.exports = app;

if (require.main === module) {
  mongoose.set('useFindAndModify', false);
  mongoose.set('useUnifiedTopology', true);
  mongoose
    .connect(process.env.DATABASE_URL, { useNewUrlParser: true })
    .then(async () => {
      console.log('mongodb ok');
      try {
        if ((await Product.countDocuments()) === 0) {
          await seedProductsFromJson();
        }
      } catch (err) {
        console.error('seed products', err);
      }
      app.listen(port, '0.0.0.0', () => {
        console.log('listening', port);
      });
    })
    .catch((err) => {
      console.error('mongodb', err);
      process.exit(1);
    });
}
