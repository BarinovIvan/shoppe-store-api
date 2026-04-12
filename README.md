# Shoppe API

Shoppe API is an educational REST API built with Node.js (Express) and MongoDB. It serves sample JSON for products,
carts, users, and a simple login flow. Run it locally or on your own server; the HTTP examples below use the public
base URL **https://shoppeapi.com** (replace it with your own origin when you self-host).

After `npm start`, open the built-in **Docs** page at `/docs` for more copy-paste examples.

## Why?

Useful when you need realistic-looking shop data for prototypes, classroom exercises, or automated tests without wiring
up a full backend or hand-authoring large fixtures.

## Resources

There are 4 main resources need in shopping prototypes:

- Products https://shoppeapi.com/products
- Carts https://shoppeapi.com/carts
- Users https://shoppeapi.com/users
- Login Token https://shoppeapi.com/auth/login

### New! "Rating" (includes rate and count) has been added to each product object!

## How to

you can fetch data with any kind of methods you know(fetch API, Axios, jquery ajax,...)

### Get all products

```js
fetch("https://shoppeapi.com/products")
  .then((res) => res.json())
  .then((json) => console.log(json));
```

### Get a single product

```js
fetch("https://shoppeapi.com/products/1")
  .then((res) => res.json())
  .then((json) => console.log(json));
```

### Add new product

```js
fetch("https://shoppeapi.com/products", {
  method: "POST",
  body: JSON.stringify({
    title: "test product",
    price: 13.5,
    description: "lorem ipsum set",
    image: "https://i.pravatar.cc",
    category: "electronic",
  }),
})
  .then((res) => res.json())
  .then((json) => console.log(json));

/* will return
{
 id:31,
 title:'...',
 price:'...',
 category:'...',
 description:'...',
 image:'...'
}
*/
```

Note: Posted data will not really insert into the database and just return a stub id.

### Updating a product

```js
fetch("https://shoppeapi.com/products/7", {
  method: "PUT",
  body: JSON.stringify({
    title: "test product",
    price: 13.5,
    description: "lorem ipsum set",
    image: "https://i.pravatar.cc",
    category: "electronic",
  }),
})
  .then((res) => res.json())
  .then((json) => console.log(json));

/* will return
{
    id:7,
    title: 'test product',
    price: 13.5,
    description: 'lorem ipsum set',
    image: 'https://i.pravatar.cc',
    category: 'electronic'
}
*/
```

```js
fetch("https://shoppeapi.com/products/8", {
  method: "PATCH",
  body: JSON.stringify({
    title: "test product",
    price: 13.5,
    description: "lorem ipsum set",
    image: "https://i.pravatar.cc",
    category: "electronic",
  }),
})
  .then((res) => res.json())
  .then((json) => console.log(json));

/* will return
{
    id:8,
    title: 'test product',
    price: 13.5,
    description: 'lorem ipsum set',
    image: 'https://i.pravatar.cc',
    category: 'electronic'
}
*/
```

Note: Edited data will not really be updated into the database.

### Deleting a product

```js
fetch("https://shoppeapi.com/products/8", {
  method: "DELETE",
});
```

Nothing will delete on the database.

### Sort and Limit

You can use query string to limit results or sort by asc|desc

```js
// Example: limit and sort products
fetch("https://shoppeapi.com/products?limit=3&sort=desc")
  .then((res) => res.json())
  .then((json) => console.log(json));
```

## All available routes

### Products

```js
fields:
{
    id:Number,
    title:String,
    price:Number,
    category:String,
    description:String,
    image:String
}
```

GET:

- /products (get all products)
- /products/1 (get specific product based on id)
- /products?limit=5 (limit return results )
- /products?sort=desc (asc|desc get products in ascending or descending orders (default to asc))
- /products?category=rings (get all products in a category; combine with limit and sort, e.g. `?category=chains&sort=desc`)
- /products/categories (get all categories as `{ "categories": [{ "id", "name" }, ...] }`)

POST:

- /products

-PUT,PATCH

- /products/1

-DELETE

- /products/1

### Carts

```js
fields:
{
    id:Number,
    userId:Number,
    date:Date,
    products:[{productId:Number,quantity:Number}]
}
```

GET:

- /carts (get all carts)
- /carts/1 (get specific cart based on id)
- /carts?startdate=2020-10-03&enddate=2020-12-12 (get carts in date range)
- /carts/user/1 (get a user cart)
- /carts/user/1?startdate=2020-10-03&enddate=2020-12-12 (get user carts in date range)
- /carts?limit=5 (limit return results )
- /carts?sort=desc (asc|desc get carts in ascending or descending orders (default to asc))

POST:

- /carts

PUT,PATCH:

- /carts/1

DELETE:

- /carts/1

### Users

```js
fields:
{
    id:20,
    email:String,
    username:String,
    password:String,
    name:{
        firstname:String,
        lastname:String
        },
    address:{
    city:String,
    street:String,
    number:Number,
    zipcode:String,
    geolocation:{
        lat:String,
        long:String
        }
    },
    phone:String
}
```

GET:

- /users (get all users)
- /users/1 (get specific user based on id)
- /users?limit=5 (limit return results )
- /users?sort=desc (asc|desc get users in ascending or descending orders (default to asc))

POST:

- /users

PUT,PATCH:

- /users/1

DELETE:

- /users/1

### Auth

```js
fields:
{
    username:String,
    password:String
}
```

POST:

- /auth/login

## ToDo

- Add graphql support
- Add pagination
- Add another language support
