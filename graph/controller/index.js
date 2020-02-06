const sequelize = require('../../db/sequelize');

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const symbols = require('../symbols').symbols;
const { getExistingData, getNewData, insertOneData } = require('../../db/db-helper');
const baseHTML = fs.readFileSync(path.join(__dirname, `../html/index.html`), 'utf8');
const os = require('os');
const puppeteer = require('puppeteer');
var graphsDir = path.join(__dirname, `../../output`);
const { convertTimeframe, timeStamp_day, elder } = require('./assist');
const { insertData } = require('../../db/models/dynamic');

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

async function getAllData(options) {
    const { symbol } = options;
    const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol});

    var process_day_data = [];
    var ex_stamp = '';
    var temp_array = [];

    ohlc
        .slice()
        .reverse()
        .map(( element, index ) => {
            if (ex_stamp !== timeStamp_day(element.time)) {                        
                if (ex_stamp !== '') {
                    process_day_data.push(convertTimeframe(temp_array));
                    ex_stamp = timeStamp_day(element.time);
                    temp_array = [];
                    temp_array.push(element);
                } else {
                    ex_stamp = timeStamp_day(element.time);
                    temp_array.push(element);
                }
            } else {
                temp_array.push(element);
                if (index === ohlc.length -1) process_day_data.push(convertTimeframe(temp_array));
            }
        });
    
    const result = elder(process_day_data);    
    const result_min = elder(ohlc.reverse());

    insertData({ data: result_min.elder, modelName: `${symbol}_elder`, type: 'elder' });
 
    return { ohlc: process_day_data.reverse(), elder: result.elder, ema: result.ema.slice(0, 20), macd: result.macd.slice(0, 20), ohlc_min: ohlc.slice(0,20), ema_min: result_min.ema.slice(0, 20), macd_min: result_min.macd.slice(0, 20), elder_min: result_min.elder.slice(0, 20) };
}

async function getOneData(options) {
    const { symbol } = options;
    const ohlc = await getNewData({ type: 'ohlc', modelName: symbol });
    return ohlc;
}

async function WriteOneData(data) {
    insertOneData({type: 'elder', modelName: 'spy_elder', data})
    return 'ok';
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
    getAllData,
    getOneData,
    WriteOneData,
};
