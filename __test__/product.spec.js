const supertest = require('supertest');
const app = require('../server');

describe('Testing products API', () => {
  it('returns 403 without student cookie', async () => {
    const response = await supertest(app).get('/products');
    expect(response.status).toBe(403);
  });

  it('all product', async () => {
    const response = await supertest(app).get('/products').set('Cookie', 'authorization=amigo');
    expect(response.status).toBe(200);
    console.log('get', response.body);
    expect(response.body).not.toStrictEqual([]);
  });

  it('get categories returns objects with id and name', async () => {
    const response = await supertest(app)
      .get('/products/categories')
      .set('Cookie', 'authorization=amigo');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        categories: expect.any(Array),
      })
    );
    for (const item of response.body.categories) {
      expect(item).toEqual(
        expect.objectContaining({ id: expect.any(Number), name: expect.any(String) })
      );
    }
  });

  it('get a single product', async () => {
    const list = await supertest(app).get('/products?limit=1').set('Cookie', 'authorization=amigo');
    expect(list.status).toBe(200);
    expect(list.body[0]).toBeDefined();
    const id = list.body[0].id;
    const response = await supertest(app)
      .get(`/products/${id}`)
      .set('Cookie', 'authorization=amigo');
    expect(response.status).toBe(200);
    console.log('get by id', response.body);
    expect(response.body).not.toStrictEqual({});
    expect(response.body).toHaveProperty('title');
  });

  it('get products in a category', async () => {
    const response = await supertest(app)
      .get('/products?category=chains')
      .set('Cookie', 'authorization=amigo');
    expect(response.status).toBe(200);
    console.log('get by category', response.body);
    expect(response.body).not.toStrictEqual([]);
  });

  it('get products in a limit and sort', async () => {
    const response = await supertest(app)
      .get('/products?limit=3&sort=desc')
      .set('Cookie', 'authorization=amigo');
    expect(response.status).toBe(200);
    console.log('get with querystring', response.body);
    expect(response.body).not.toStrictEqual([]);
    expect(response.body).toHaveLength(3);
  });

  it('post a product', async () => {
    const response = await supertest(app)
      .post('/products')
      .set('Cookie', 'authorization=amigo')
      .send({
        title: 'test',
        price: 13.5,
        description: 'test desc',
        image: 'test img',
        category: 'text cat',
      });
    expect(response.status).toBe(200);
    console.log('post', response.body);
    expect(response.body).toHaveProperty('id');
  });

  it('put a product', async () => {
    const response = await supertest(app)
      .put('/products/1')
      .set('Cookie', 'authorization=amigo')
      .send({
        title: 'test',
        price: 13.5,
        description: 'test desc',
        image: 'test img',
        category: 'text cat',
      });
    expect(response.status).toBe(200);
    console.log('put', response.body);
    expect(response.body).toHaveProperty('id');
  });

  it('patch a product', async () => {
    const response = await supertest(app)
      .patch('/products/1')
      .set('Cookie', 'authorization=amigo')
      .send({
        title: 'test',
        price: 13.5,
        description: 'test desc',
        image: 'test img',
        category: 'text cat',
      });
    expect(response.status).toBe(200);
    console.log('patch', response.body);
    expect(response.body).toHaveProperty('id');
  });

  it('delete a product', async () => {
    const response = await supertest(app).put('/products/1').set('Cookie', 'authorization=amigo');
    expect(response.status).toBe(200);
    console.log('delete', response.body);
    expect(response.body).toHaveProperty('id');
  });
});
