import express from 'express';
import bodyParser from 'body-parser';

/*
* Since the /details endpoint accepts JSON as a POST request, it may require CORS be configured if the 'client' of the request
* is a web browser or some other source that enforces CORS. This package allows you to configure CORS.
*/
// import cors from 'cors';

import { initializeDB, getDailyCallCountByCust, activityLog, getCDRDetails } from './database.js';

const app = express();
const port = 3100;

/*
* This is a sample configuration of CORS for this server. No origins are provided since this was tested with Postman.
*/
// app.use(cors({
//     origin: 'CLIENT ADDRESS',
//     methods: 'GET,POST',
//     allowedHeaders: 'Content-Type,Accept',
//     preflightContinue: true
// }));

app.use(bodyParser.json());

app.get('/summary', async (req, res, next) => {
    let status = 200;
    const custID = (req.query.cust_id) ? +req.query.cust_id : null;
    const dailyCallCount = await getDailyCallCountByCust(custID);

    if(!dailyCallCount.length){
        status = 404;
    }

    res.status(status).json(dailyCallCount);
});

app.get('/logs', async (req, res, next) => {
    let status = 200;
    const activity = await activityLog();

    if(!activity.length){
        status = 404;
    }

    res.status(status).json(activity);
});

/*
* If CORS was being used, the POST request would be preflighted with an OPTIONS request, and we would need to handle
* that HTTP method with this line below.
*/
// app.options('/details');
app.post('/details', async (req, res, next) => {
    let status = 200;
    const id = (req.body.id) ? req.body.id : null;
    const custID = (req.body.cust_id) ? +req.body.cust_id : null;
    const callerID = (req.body.caller_id) ? req.body.caller_id : null;
    const cdrDetails = await getCDRDetails(id, custID, callerID);

    if(!cdrDetails.length){
        status = 404;
    }

    res.status(status).json(cdrDetails);
});

try{
    app.listen(port);
    await initializeDB();
    console.log('Server started.');
}catch(error){
    console.log(error);
}