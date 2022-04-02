const client = require('./elasticClient.js');

const createIndex = async function (indexName, mapping) { //check if given index exists, if not create
    try {
        await client.indices.get({
            index: indexName
        });
    }
    catch (e) {
        await client.indices.create({
            index: indexName
        });
    }
    try {
        const map = await client.indices.getMapping({ index: indexName }); //check if given mapping exists, if not create
        if (Object.keys(map.body[indexName].mappings).length === 0) {
            return await client.indices.putMapping({
                index: indexName,
                body: mapping
            });
        }
    }
    catch (e) {
        console.log(e);
    }
}

module.exports = createIndex;