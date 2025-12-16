import express from 'express';
// import bodyParser from 'body-parser';

import { initializeDB, getDailyCallCountByCust, activityLog } from './database.js';

const app = express();
const port = 3100;

// app.use(bodyParser.json());

app.get('/details', async (req, res, next) => {
    
});

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

try{
    app.listen(port);
    await initializeDB();
    console.log('Server started with DB connection.');
}catch(error){
    console.log(error);
}