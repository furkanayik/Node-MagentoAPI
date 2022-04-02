const express = require('express');
const router = express.Router();
const objectScan = require('object-scan');
const fetch = require('node-fetch');

const url_category = process.env.MAGENTO+'/index.php/rest/V1/categories';

const getOptions = {
    method: 'GET',
    headers: { 'Authorization': process.env.MAGENTOTOKEN }
}

const translateCategories = (lang, p_data) => { //object-scan
    const categories = require('../lang/categories/' + lang + '.json');
    const wordMap = new Map(objectScan(['[*].*'], { rtn: ['property', 'value'] })(categories));
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
  };

router.get('/', async (req, res) => {
    const lang = req.headers['accept-language']; //get lang header
    const fetchRes = await fetch(url_category, getOptions);
    const categories = await fetchRes.json();

    if (lang.length < 3 && lang != 'en') { //if accept lang header has been set
        //categories = reqursiveTranslate(lang, categories);
        translateCategories(lang,categories);
    }
    res.send(categories);
});

module.exports=router;