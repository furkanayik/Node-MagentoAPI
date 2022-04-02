const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const url_country = process.env.MAGENTO + '/index.php/rest/V1/directory/countries';

const getOptions = {
    method: 'GET',
    headers: { 'Authorization': process.env.MAGENTOTOKEN }
}

function translateCountries(langCode, p_data) {
    const lang = require('../lang/countries/' + langCode + '.json');
    lang.forEach((l) => { //compare every key with name filed of the data
        Object.entries(l).map(([key, value]) => {
            p_data.map((item) => {
                if (item.name === key) {
                    item.name = value
                }
            })
        })
    });
    return p_data;
};


router.get('/', async (req, res) => {
    const fetchRes = await fetch(url_country, getOptions);
    const countries = await fetchRes.json();
    const lang = req.headers['accept-language']; //get lang header

    let countryData = countries.map(elm => ({ id: elm.id, name: elm.full_name_english }));//get data with required keys

    if (lang.length < 3 && lang != 'en') { //if accept lang header has been set
        countryData = translateCountries(lang, countryData);
    }
    res.send(countryData);
});

module.exports = router;