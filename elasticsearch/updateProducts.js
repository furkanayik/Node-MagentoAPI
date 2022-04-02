const { default: fetch } = require('node-fetch');
const clientIndex = require('./createIndex.js');
const objectScan = require('object-scan');
const client = require('./elasticClient.js');
let url_products = proccess.env.MAGENTO + '/index.php/rest/V1/products?' +
    'searchCriteria[filter_groups][0][filters][0][field]=category_id&' +
    'searchCriteria[filter_groups][0][filters][0][value]=*CATEGORYIDS*&' +
    'searchCriteria[filter_groups][0][filters][0][condition_type]=in&' +
    'fields=items[id,sku,name,price,custom_attributes],total_count';
const url_category = proccess.env.MAGENTO + '/index.php/rest/V1/categories';
const getOptions = {
    method: 'GET',
    headers: { 'Authorization': proccess.env.MAGENTOTOKEN }
}

const mapping = {
    properties: {
        id: {
            type: "integer"
        },
        sku: {
            type: "text"
        },
        name: {
            type: "text"
        },
        price: {
            type: "integer"
        },
        image: {
            type: "text"

        },
        description: {
            type: "text"
        }
    }
}

const getCategories = (p_data) => {
    return objectScan(['**(^children_data$)'], {
        useArraySelector: false,
        rtn: 'value',
        filterFn: ({ isLeaf, value }) => !isLeaf && value.product_count != 0 && value.children_data.length === 0
        //product count != 0 and has no children_data (nested category)
    })(p_data);
};

const updateProducts = async function () {
    const fetchRes = await fetch(url_category, getOptions);
    const data = await fetchRes.json();
    categories = getCategories(data); //get the categories without children data and product_count != 0 

    let catIdString = JSON.stringify(categories.map(i => i.id));
    catIdString = catIdString.substring(1, catIdString.length - 1); //get rid of the brackets
    url_products = url_products.replace('*CATEGORYIDS*', catIdString); //replace with ID's

    try {
        const resp = await clientIndex('products', mapping);
        const fetchRes = await fetch(url_products, getOptions); //get the product data
        const products = await fetchRes.json();

        const items = products.items.map(({ custom_attributes, ...item }) => { //map image and description values from array
            const image = custom_attributes.find(
                ({ attribute_code }) => attribute_code === 'image'
            )?.value;
            let description = custom_attributes.find(
                ({ attribute_code }) => attribute_code === 'description'
            )?.value;

            if(description === undefined){
                description = 'undefined'
            }

            if(image === undefined){
                description = 'undefined'
            }

            return {
                ...item,
                image,
                description
            };
        });
        for (let i = 0; i < items.length; i++) {
            const idxRes = await client.index({ id: i, index: 'products', body: items[i] });
        }
        console.log('Elasticsearch index has been updated');

    } catch (e) {
        console.log(e);
    }
}

module.exports = updateProducts;