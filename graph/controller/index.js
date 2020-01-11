const sequelize = require('../../db/sequelize');

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const symbols = require('../symbols').symbols;
const { getExistingData } = require('../../db/db-helper');
const baseHTML = fs.readFileSync(path.join(__dirname, `../html/index.html`), 'utf8');
const os = require('os');
const puppeteer = require('puppeteer');
var graphsDir = path.join(__dirname, `../../output`);

function getHTML() {
    const dom = new JSDOM(baseHTML);
    let graphs = symbols.map(symbol => {
        let node = dom.window.document.createElement('div');
        node.id = symbol;
        node.setAttribute('symbol', symbol);
        node.style.height = '90vh';
        node.className = 'chart';
        return node;
    });
    const parent = dom.window.document.getElementById('charts');
    while (parent.firstChild) {
        parent.firstChild.remove();
    }

    graphs.forEach(node => parent.appendChild(node));
    return dom.serialize();
}

async function getData(options) {
    const { type, symbol } = options;
    let result;
    switch (type) {
        case 'elder':
            const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol, order:'ASC' });
            const elder = await getExistingData({ type: 'elder', modelName: `${symbol}_elder`, order:'ASC' });
            result = { ohlc, elder };

            break;
        default:
            result = [];
    }
    return result;
}

async function makeGraph() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
    });
    let hostname = os.hostname() || 'localhost';
    let port = process.env.GRAPH_SERVER_PORT || 8080;
    await page.goto(`http://${hostname}:${port}`, { waitUntil: 'networkidle0' });
    // await page.setContent(getHTML(), { waitUntil: 'networkidle0' });
    // await page.addScriptTag({
    //     path: path.join(__dirname, `../scripts/main.js`),
    // });
    const images = await page.evaluate(() => {
        const images = [];
        const charts = document.getElementsByClassName('chart');
        for (chart of charts) {
            let symbol = chart.getAttribute('symbol');
            let canvas = chart.querySelector('canvas');
            images.push({ symbol, url: canvas.toDataURL() });
        }
        return images;
    });
    browser.close();

    // first make sure the folder exists
    if (!fs.existsSync(graphsDir)) {
        fs.mkdirSync(graphsDir);
    }
    // save as files
    images.forEach(image => {
        let base64String = image.url;
        // Remove header
        let base64Image = base64String.split(';base64,').pop();
        fs.writeFile(path.join(graphsDir, `${image.symbol}.png`), base64Image, { encoding: 'base64' }, function(
            err
        ) {});
    });
    return images.map(({ symbol }) => symbol);
}

module.exports = {
    getHTML,
    makeGraph,
    getData,
};
