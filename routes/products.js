const express = require('express');
const router = express.Router();
const elasticSearch = require('../elasticsearch/search.js');

router.get('/', async (req, res) => {
    const size = (req.query.limit == null ? 20 : req.query.limit);
    const from = (req.query.offset == null ? 0 : req.query.offset);
    const q = (req.query.q == null ? '' : req.query.q);

    const items = await elasticSearch('products', size, from, q);
    res.send(items);
});

module.exports=router;