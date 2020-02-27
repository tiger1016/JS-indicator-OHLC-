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
    dataOnlineProcess,
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
            //console.log(ohlc)
            const elder = await getExistingData({ type: 'elder', modelName: `${symbol}_elder` });
            //console.log(elder)
            if (ohlc.length === 0) {
                result = { ohlc: [], elder: [] };
            } else {
                const data = colorsForday(ohlc);
                if (data.min_elder.length !== elder.length) {
                    insertData({ data: data.min_elder.slice().reverse().slice(0, data.min_elder.length - elder.length), modelName: `${symbol}_elder`, type: 'elder' });
                }
                const colorsOfelder = getColorsForday(data.min_elder);
                //console.log(colorsOfelder)
                result = { ohlc: data.process_day_data, elder: colorsOfelder };
                gStore[symbol] = { ex_stamp: data.ex_stamp, process_day_data: data.process_day_data, colorsOfelder };
             }

            break;
        default:
            result = [];
    }
    return result;
}



async function getOneData(options) {
    const { type, symbol } = options;
    let result;
    switch (type) {
        case 'elder':            
            if (typeof gStore[symbol] === 'object') {
                // const ohlc_new = await getExistingData({ type: 'ohlc', modelName: 'spy', limit: 5 });
                // var process_day_data = gStore[symbol].process_day_data;
                // const index = ohlc_new.findIndex(element => element.time === process_day_data[process_day_data.length - 1].time);
                // // console.log(process_day_data[0])
    
                // const data_updated = await dataOnlineProcess(ohlc_new.slice(index + 1), symbol);

                // const min_elder = data_updated.min_elder;
                // insertData({ data: min_elder.slice().reverse(), modelName: `${symbol}_elder`, type: 'elder' });

                // const day_elder = gstore[symbol].colorsOfelder;
                // let last_day_elder = old_day_elder[old_day_elder.length-1];

                // //updated day_elder
                // min_elder
                // .slice()
                // .reverse()
                // .map(element => {
                //     if(timeStamp_day(element) === timeStamp_day(last_day_elder)){
                //         temp = day_elder.pop();
                //         day_elder.push(element)
                //     }else{
                //         day_elder.push(element);
                //     }
                // })

                // gStore[symbol].process_day_data=data_updated.process_day_data;
                // gStore[symbol].ex_stamp=data_updated.ex_stamp;
                // gStore[symbol].colorsOfelder=day_elder
                //result = { ohlc: gStore[symbol].process_day_data, elder: gStore[symbol].colorsOfelder }; 
            }
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
