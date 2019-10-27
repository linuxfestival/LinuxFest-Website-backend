const request = require('supertest');

const app = require('../src/app');
const { openDatabase, closeDatabase } = require('./fixtures/db');

beforeAll(initDatabase);
afterAll(closeDatabase);
