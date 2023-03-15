import {describe, expect, test} from '@jest/globals';
import request from 'supertest';
// const request = require('supertest')
import {app} from '../app'
import {add} from '../mockTestFunc/index';

// async test returning a promise with done callback param
test('Should add 2 numbers', (done) => {
  add(2, 3).then((sum) => {
    expect(sum).toBe(5)
    done()
  })
});
// async test returning a promise with async
test('Should add two numbers async/await', async () => {
  const sum = await add(10, 22);
  expect(sum).toBe(32)
});
// fetching all bids of all markets
test('Should fetch all bids of all markets', async() => {
  await request(app)
    .get('/bids')
    .expect(200)
});
// fetching all bids of all markets
test('Should fetch all bids of a specific markets', async() => {
  await request(app)
    .get('/bids/6FcJaAzQnuoA6o3sVw1GD6Ba69XuL5jinZpQTzJhd2R3')
    .expect(200)
});