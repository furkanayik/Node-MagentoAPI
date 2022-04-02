const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICUSER,
    password: process.env.ELASTICPASS
  },
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true
})

module.exports = client;