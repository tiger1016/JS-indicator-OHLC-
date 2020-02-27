require('dotenv').config();
const argv = require('yargs').argv;

const express = require('express');
const app = express();
const path = require('path');
const controller = require('./controller');
const config = require('../config/config.json');
const sequelize = require('../db/sequelize');

const port = config.GRAPH_SERVER_PORT || 8020;

app.get('/', async function(req, res) {
    console.log(` here server get(/) start`)
    let result = await controller.getHTML();
    
    res.set('Content-Type', 'text/html');
    res.send(result);
    console.log(` here server get(/) end`);
});

app.get('/data', async function(req, res) {
    const { type, symbol, cond } = req.query;
    console.log(`server ${cond}`);
    let result;
    if (cond === 'all') {
        result = await controller.getAllData({ type, symbol });
    } else if (cond === 'one') {
        result = await controller.getOneData({ type, symbol });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(result);
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