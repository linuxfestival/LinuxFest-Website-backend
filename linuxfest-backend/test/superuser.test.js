const request = require('supertest');

const app = require('../src/app');
const { initDatabase, closeDatabase } = require('./fixtures/db');

beforeAll(initDatabase);
afterAll(closeDatabase);
