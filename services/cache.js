const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisURI);
const exec = mongoose.Query.prototype.exec;

client.hget = util.promisify(client.hget);


mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // Create a key for the redis caching
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));

  // Get cached value
  const cacheValue = await client.hget(this.hashKey, key);

  // If cached value exists, return it
  if (cacheValue) {
    // Parse to object
    const document = JSON.parse(cacheValue);

    // Parse to model, check if array
    return Array.isArray(document)
      ? document.map(d => new this.model(d))
      : new this.model(document);
  }

  // Super method - get value from database
  const result = await exec.apply(this, arguments);

  // Cache result
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 3600 * 24 * 2);

  // Return result
  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};