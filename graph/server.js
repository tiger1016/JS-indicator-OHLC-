require('dotenv').config();
const argv = require('yargs').argv;

const express = require('express');
const app = express();
const path = require('path');
const controller = require('./controller');
const config = require('../config/config.json');
const sequelize = require('../db/sequelize');

var bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const port = config.GRAPH_SERVER_PORT || 8020;

app.get('/', async function(req, res) {
    let result = await controller.getHTML();
    
    res.set('Content-Type', 'text/html');
    res.send(result);
});

app.get('/data', async function(req, res) {
    const { type, symbol, cond } = req.query;

    let result;
    if (cond === 'all') {
        result = await controller.getAllData({ type, symbol });
    } else if (cond === 'one') {
        result = await controller.getOneData({ type, symbol });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(result);
});

app.post('/drawing', async function(req, res) {
    let result = await controller.makeOnlineGraph(req.body);
});

app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

sequelize.sequelize_ohlc.authenticate()
    .then(() => {
        console.log(`Connection established successfully with "${config.ohlc.DB_NAME}" db`);
        sequelize.sequelize_elder.authenticate()
            .then(() => {
                console.log(`Connection established successfully with "${config.elder.DB_NAME}" db`);
                app.listen(port, () => console.log(`App listening on port ${port}`));
            })
            .catch(err => {
                console.error(`Unable to connect to the database "${config.elder.DB_NAME}" db`);
                sequelize.sequelize_ohlc.close();
                sequelize.sequelize_elder.close();
            });
    })
    .catch(err => {
        console.error(`Unable to connect to the database "${config.ohlc.DB_NAME}" db`);
        sequelize.sequelize_ohlc.close();
    });