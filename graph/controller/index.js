const { insertData } = require('../../db/models/dynamic');

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const symbols = require('../symbols').symbols;
const { getExistingData } = require('../../db/db-helper');
const baseHTML = fs.readFileSync(path.join(__dirname, `../html/index.html`), 'utf8');
const os = require('os');
const puppeteer = require('puppeteer');
var graphsDir = path.join(__dirname, `../../output`);
const {
    timeStamp_day,
    elder,
    colorsForday,
    getColorsForday,
} = require('./assist');
var gStore = {};

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

async function getAllData(options) {
    const { type, symbol } = options;
    let result;
    switch (type) {
        case 'elder':
            const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol });
            console.log(ohlc.length);

            if (ohlc.length === 0) {
                result = { ohlc: [], elder: [] };
            } else {
                const data = colorsForday(ohlc);
                insertData({ data: data.min_elder.slice().reverse(), modelName: `${symbol}_elder`, type: 'elder' });
                const colorsOfelder = getColorsForday(data.min_elder);
                result = { ohlc: data.process_day_data, elder: colorsOfelder };
                gStore[symbol] = { ex_stamp: data.ex_stamp, process_day_data: data.process_day_data, colorsOfelder };
            }

            break;
        default:
            result = [];
    }
    return result;
}

const dataOnlineProcess = (new_ohlc, symbol) => {
    var { ex_stamp, process_day_data, colorsOfelder } = gStore[symbol];

    new_ohlc
        .slice()
        .map( (element, index) => {
            if (ex_stamp !== timeStamp_day(element.time)) {
                ex_stamp = timeStamp_day(element.time);
                process_day_data.push(element);
            } else {
                var temp = process_day_data.pop();
                temp.time = element.time;
                temp.high = Math.max(temp.high, element.high);
                temp.low = Math.min(temp.low, element.low);
                temp.close = element.close;
                process_day_data.push(temp);
                ex_stamp = timeStamp_day(element.time);
            }
        });

    var min_elder = [];
    new_ohlc
        .slice()
        .map(element => {
            var temp_data = [];
            const index = process_day_data.findIndex(e => timeStamp_day(e.time) === timeStamp_day(element.time));
            if (ex_stamp === timeStamp_day(element.time)) {
                temp_data = [...process_day_data.slice(0, index), element];
            } else {
                temp_data = [...process_day_data.slice(0, index + 1), element];
            }
            min_elder = [...min_elder, elder(temp_data.reverse()).elder[0]];
        });

    const colors_res = [];
    const ex_element = colorsOfelder[colorsOfelder.length - 1];

    for (var i = 0; i < min_elder.length; i ++) {
        if (timeStamp_day(min_elder[i].time) !== timeStamp_day(ex_element.time)) {
            colors_res.push(element[i - 1]);
            ex_element = min_elder[i];
        }
    }

    colors_res.push(min_elder[elder.length - 1]);
    colorsOfelder = [...colorsOfelder, ...colors_res];

    gStore[symbol].ex_stamp = ex_stamp;
    gStore[symbol].process_day_data = process_day_data;
    gStore[symbol].colorsOfelder = colorsOfelder;

    return min_elder.reverse();
}

async function getOneData(options) {
    const { type, symbol } = options;
    let result;
    switch (type) {
        case 'elder':            
            if (typeof gStore[symbol] === 'object') {
                const ohlc_new = await getExistingData({ type: 'ohlc', modelName: symbol, limit: 5 });
                var process_day_data = gStore[symbol].process_day_data;
                const index = ohlc_new.findIndex(element => element.time === process_day_data[process_day_data.length - 1].time);
                const min_elder = dataOnlineProcess(ohlc_new.slice(index + 1), symbol);
                result = { ohlc: gStore[symbol].process_day_data, elder: gStore[symbol].colorsOfelder };            
                insertData({ data: min_elder, modelName: `${symbol}_elder`, type: 'elder' });
            }
            result = { ohlc: [], elder: [] };
            
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
    getAllData,
    getOneData,
};
