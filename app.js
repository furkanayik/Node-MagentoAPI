const express = require('express');
const app = express();
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

//routes
const countryRoute = require('./routes/countries');
const categoryRoute = require('./routes/categories');
const productRoute = require('./routes/products');
const customerRoute = require('./routes/customers');


if (cluster.isMaster) { //default round robin except windows(readme)
    let worker;
    console.log('cpu Count:' + numCPUs);
    for (let i = 0; i < numCPUs; i++) {
        worker = cluster.fork();
    }

} else {
    console.log(`Worker ${process.pid} started`);
    app.use('/api/V1/countries', countryRoute);
    app.use('/api/V1/categories', categoryRoute);
    app.use('/api/V1/products', productRoute);
    app.use('/api/V1/customers', customerRoute.router);

    app.listen(3000);
}