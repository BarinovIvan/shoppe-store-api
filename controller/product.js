const Product = require('../model/product');

const sendQueryError = (res, err) => {
  console.log(err);
  if (err.name === 'CastError') {
    res.status(400).json({
      status: 'error',
      message: 'Invalid id or query value',
    });
    return;
  }
  res.status(500).json({ status: 'error', message: 'Database error' });
};

module.exports.getAllProducts = (req, res) => {
  const limit = Number(req.query.limit) || 0;
  const sort = req.query.sort == 'desc' ? -1 : 1;
  const rawCategory = req.query.category;
  let filter = {};
  if (rawCategory !== undefined) {
    const first = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
    const category = typeof first === 'string' ? first.trim().toLowerCase() : '';
    if (category.length === 0) {
      res.json([]);
      return;
    }
    filter = { category };
  }

  Product.find(filter)
    .select(['-_id', '-__v'])
    .limit(limit)
    .sort({ id: sort })
    .then((products) => {
      res.json(products);
    })
    .catch((err) => sendQueryError(res, err));
};

module.exports.getProduct = (req, res) => {
  const id = req.params.id;

  Product.findOne({
    id,
  })
    .select(['-_id', '-__v'])
    .then((product) => {
      res.json(product);
    })
    .catch((err) => sendQueryError(res, err));
};

module.exports.getProductCategories = (req, res) => {
  Product.distinct('category')
    .then((categories) => {
      const names = categories
        .filter((c) => typeof c === 'string' && c.length > 0)
        .sort((a, b) => a.localeCompare(b, 'en'));
      const items = names.map((name, i) => ({ id: i + 1, name }));
      res.json({ categories: items });
    })
    .catch((err) => sendQueryError(res, err));
};

module.exports.addProduct = (req, res) => {
  if (typeof req.body === 'undefined') {
    res.json({
      status: 'error',
      message: 'data is undefined',
    });
  } else {
    // let productCount = 0;
    // Product.find()
    //   .countDocuments(function (err, count) {
    //     productCount = count;
    //   })
    //   .then(() => {
    const product = {
      id: 21,
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
    };
    // product.save()
    //   .then(product => res.json(product))
    //   .catch(err => console.log(err))
    res.json(product);
    // });
  }
};

module.exports.editProduct = (req, res) => {
  if (typeof req.body === 'undefined' || req.params.id == null) {
    res.json({
      status: 'error',
      message: 'something went wrong! check your sent data',
    });
  } else {
    res.json({
      id: parseInt(req.params.id),
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
    });
  }
};

module.exports.deleteProduct = (req, res) => {
  if (req.params.id == null) {
    res.json({
      status: 'error',
      message: 'cart id should be provided',
    });
  } else {
    Product.findOne({
      id: req.params.id,
    })
      .select(['-_id', '-__v'])
      .then((product) => {
        res.json(product);
      })
      .catch((err) => sendQueryError(res, err));
  }
};
