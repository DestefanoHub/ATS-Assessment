import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3100;

app.use(bodyParser.json());

app.get('/details', async (req, res, next) => {
    
});

app.get('/summary', async (req, res, next) => {
    const custID = (req.query.cust_id) ? +req.query.cust_id : null;
});

app.get('/logs', async (req, res, next) => {

});

try{
    app.listen(port);
    console.log('hello world!');
}catch(error){
    console.log(error);
}