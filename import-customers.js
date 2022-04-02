const csv = require('csv-parser')
const fs = require('fs')
const customer = require('./routes/customers')

const results = [];

fs.createReadStream('customers.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        let valid = {};
        for (let i = 0; i < results.length; i++) {
            valid = await customer.validateCustomerReq(results[i], 'en');
            if (!valid.success) { //all should be valid
                throw new Error('There are invalid data in the file. Execution has been stoped');
            }
        }
        //if all validated, call the magentoCustomer post with the data
        let successCount = 0;
        for (let i = 0; i < results.length; i++) {
            const res = await customer.createCustomer(results[i]);
            if(!res.success){
                console.log('Error at line: '+i+2);
                console.log('errors:'+JSON.stringify(res.errors)+'\n');
            }else{
                successCount = successCount + 1;
            }
        }
        console.log('Importing is done.\nTotal:'+i+'\nSuccessful count:'+successCount+'\nFail Count:'+(i-successCount));
    });