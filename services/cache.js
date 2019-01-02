const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');
const redisUrl = keys.redisUrl;
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget).bind(client);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
    if(!this.useCache){
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));

    const cachedValue = await client.hget(this.hashKey, key);
    if (cachedValue) {
        const returnValue = JSON.parse(cachedValue);


        return Array.isArray(returnValue)
            ? returnValue.map(doc => this.model(doc))
            : new this.model(returnValue);
    }
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    return result;
};

mongoose.Query.prototype.cache = function(options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');
    return this;
};

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey))
    }
};