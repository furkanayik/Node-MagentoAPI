# Magento Wrapper API
NodeJS Developer Case Study Solution by Furkan Ayık

[furkanayik.94@gmail.com](furkanayik.94@gmail.com)  
May 2021


## Overview
This is an a node.js API project that handles processes between end-user apps and magento2 engine.

## Tech&Dependencies

- [node.js/express](http://expressjs.com/)
- [magento2](https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html)
- [elasticsearch](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html)
- [fetch](https://www.npmjs.com/package/node-fetch)
- [object-scan](https://www.npmjs.com/package/object-scan)
- [input-validator](https://www.npmjs.com/package/node-input-validator)
- [csv-parser](https://www.npmjs.com/package/csv-parser)

## Before Deploy  
API uses **environment variables** and following 4 variables must be set. 
- MAGENTO: Magento url
- MAGENTOTOKEN: Magento API token for the authorization
- ELASTICUSER: Elastichsearch user
- ELASTICPASS: Elasticsearch password 

## Endpoints 
- http://HOST_NAME/api/V1/countries (GET)
- http://HOST_NAME/api/V1/categories (GET)
- http://HOST_NAME/api/V1/products (GET)
- http://HOST_NAME/api/V1/customer (POST)

#### Command Line Scripts: 
- node update-elasticsearch 
- node import-customers

## Development 
### Load Balancer
With [Cluster](https://nodejs.org/api/cluster.html#cluster_cluster) child processes have been created as much as the number of cpu cores. These workers share the load.

By default, this module uses round-robin algorithm
 **except** windows ([schedulingPolicy](https://nodejs.org/api/cluster.html#cluster_cluster_schedulingpolicy)). If server environment must have the windows system these tools might considired to handle the working order of workers:  
 * [pm2](https://github.com/Unitech/pm2#cluster-mode-nodejs-load-balancing--zero-downtime-reload)
 * [nginx](http://nginx.org/en/docs/http/load_balancing.html)

### Listing Countries (GET) 
Magento countries endpoint is used to get the countries data with fetch. Response brings the data as expected format and translation depend on whether *Accept-Language* header has been set or not. If there is a language code in the header, *TranslateCountries* function translates the data with key-value match.

### Listing Categories (GET)
Magento categories endpoint is used to get the category data with fetch. Response brings the data as expected format and translation depend on whether Accept-Language header has been set or not. Firstly **reqursive function** is tryed but because of the poor performance, [object-scan](https://www.npmjs.com/package/object-scan) is implemented.

```javascript
return objectScan(['**(^children_data$).name'], {
      useArraySelector: false, //go deep levels
      rtn: 'count',
      filterFn: ({ parent, property, value }) => {
        if (wordMap.has(value)) { 
          parent[property] = wordMap.get(value); //if matched
          return true;
        }
        return false;
      }
    })(p_data);
```

### Products
Elasticsearch has been installed and there is a folder named *elasticsearch* in the project for the related js files. 

#### **Update Products**
This module firsly gets the magento categories for the *search* criteria. In the categories, **category id** of the objects is filtered which has no *children_data* (empty array) and *product_count* is not equal to 0. 

```javascript
return objectScan(['**(^children_data$)'], {
        useArraySelector: false,
        rtn: 'value',
        filterFn: ({ isLeaf, value }) => !isLeaf && value.product_count != 0 && value.children_data.length === 0
        //product count != 0 and has no children_data (nested category)
    })(p_data);
```

After having the category id's, magento [search](https://devdocs.magento.com/guides/v2.4/rest/performing-searches.html) is used to get product data with desired criteria.

```bash
/index.php/rest/V1/products?searchCriteria[filter_groups][0][filters][0][field]=category_id&
    searchCriteria[filter_groups][0][filters][0][value]=*CATEGORYIDS*&
    searchCriteria[filter_groups][0][filters][0][condition_type]=in&
    fields=items[id,sku,name,price,custom_attributes],total_count
```
\*CATEGORYIDS is replaced with filtered category id's string and *condition_type* is set to **in**  

After formating the data as desired, elasticsearch **clientIndex**(createIndex) is used to check/create index and map. If given index and mapping is'n exists, it creates the index and mapping first.  
Then, with elasticsearch **index** products data is imported to elasticseach one by one in loop.

#### **Search Products**
Depends on the request params, uses the elasticseach **search**. And returns data in the index.
<br/><br/><br/>

### Customers  
#### **Create Customer** 
2 seperate functions are created for modularity. 
* createCustomer
* validateCustomerReq

For validation [node-input-validator](https://www.npmjs.com/package/node-input-validator) is used. It has its own ruled based messages but custom messages and translation file are created.
```javascript
const v = new Validator(input, {
        email: 'required|email',
        password: 'required|minLength:5|regex:^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$',
        firstname: 'required',
        lastname: 'required'
    }, valMessages);
```
If a request is valid depend on this, magento post customer endpoint is used and depend on the results success, id or backend messages are returned.

#### **Import Customers**
2 function that mentioned above is used in order to get and import multiple customer data from a csv file. Firslty, all data in file is checked if all of them are valid. If not, an exception is thrown and execution is stoped. If all are valid; create customer is called for each data to post customers.
