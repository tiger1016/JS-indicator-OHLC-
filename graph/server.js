require('dotenv').config();
const argv = require('yargs').argv;

const express = require('express');
const app = express();
const path = require('path');
const controller = require('./controller');
const port = process.env.GRAPH_SERVER_PORT || 8080;

app.get('/', async function(req, res) {
    let result = await controller.getHTML();
    res.set('Content-Type', 'text/html');
    res.send(result);
});

app.get('/data', async function(req, res) {
    const { type, symbol } = req.query;
    let result = await controller.getData({ type, symbol });
    res.setHeader('Content-Type', 'application/json');
    res.send(result);
});

app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

app.listen(port, () => console.log(`App listening on port ${port}`));
