const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { Validator } = require('node-input-validator');
const url_customers = process.env.MAGENTO + '/index.php/rest/V1/customers';

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const postOptions = {
    method: 'POST',
    headers: { 'Authorization': process.env.MAGENTOTOKEN, 'Content-Type': 'application/json' }
}


let valMessages = { //custom messages
    'password.regex': 'Password must contain at least one letter/number.',
    'password.minLength': 'Password must be at least 5 chars.',
    'password.required': 'Password is required.',
    'email.email': 'Email is not valid.',
    'email.required': 'Email is required.',
    firstname: 'Firstname is required.',
    lastname: 'Lastname is required.'
};

function translateMessages(lang, p_data) {
    const langValues = require('../lang/customers/' + lang + '.json');
    langValues.forEach((l) => {
        Object.entries(l).map(([key, value]) => { //translate messages if matched
            p_data[key] = value
        })
    });
    return p_data;
}

async function validateCustomerReq(input, lang) {
    const v_return = {};
    if (lang.length < 3 && lang != 'en') { //if accept lang header has been set
        valMessages = translateMessages(lang, valMessages);
    }

    const v = new Validator(input, {
        email: 'required|email',
        password: 'required|minLength:5|regex:^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$', //numbers && chars 
        firstname: 'required',
        lastname: 'required'
    }, valMessages);

    await v.check().then(async (matched) => {
        if (!matched) { //not validated
            Object.entries(v.errors).map(([key, value]) => {
                v.errors[key] = value.message;
            });//trim the nested part
            v_return.success = false;
            v_return.errors = v.errors;
        } else {//validated
            v_return.success = true;
        }
    });
    return v_return;
}

async function createCustomer(p_body) {
    const v_return = {};
    postOptions.body = JSON.stringify({ "customer": { "email": p_body.email, "firstname": p_body.firstname, "lastname": p_body.lastname }, "password": p_body.password });
    const fetchRes = await fetch(url_customers, postOptions);
    const customer = await fetchRes.json();

    if (customer.id == null) { //if couldn't create a customer
        v_return.success = false;
        v_return.errors = { backend: customer.message };
        return v_return;
    } else { //success
        v_return.success = true;
        v_return.id = customer.id;
        return v_return;
    }
}


router.post('/', async (req, res) => {
    const lang = req.headers['accept-language']; //get lang header
    let v_return = await validateCustomerReq(req.body, lang);

    if (!v_return.success) { //not validated
        res.status(400).send(v_return);
    } else {//validated
        v_return = await createCustomer(req.body);

        if (!v_return.success) { //if couldn't create a customer
            res.status(400).send(v_return);
        } else { //success
            res.status(201).send(v_return);
        }
    }
});

module.exports.validateCustomerReq = validateCustomerReq;
module.exports.createCustomer = createCustomer;
module.exports.router = router;