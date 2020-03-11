const { insertData } = require('../../db/models/dynamic');

const { JSDOM } = require('jsdom');
const fs = require('fs');
const util = require('util');
const path = require('path');
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

const pos = "./config/readSymbols.txt";
var symbols = [];

const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');

async function getHTML() {
    const dom = new JSDOM(baseHTML);

    const data = await readFile(pos);
    
    symbols = data.split("\n");
      
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

            if (ohlc.length === 0) {
                result = { ohlc: [], elder: [] };
            } else {
                const data = colorsForday(ohlc, symbol);
                if (data.min_elder.length !== elder.length) {
                    insertData({ data: data.min_elder, modelName: `${symbol}_elder`, type: 'elder' });
                }
                const colorsOfelder = getColorsForday(data.min_elder);
                result = { ohlc: data.process_day_data, elder: colorsOfelder };
                const check = data.min_elder.length === 0 ? true : false;
                gStore[symbol] = { ex_stamp: data.ex_stamp, process_day_data: data.process_day_data, colorsOfelder, elderFlag: check };
             }

            break;
        default:
            result = [];
    }
    return result;
}

const dataOnlineProcess = (new_ohlc, symbol) => {
    let process_day_data = [...gStore[symbol].process_day_data];
    let ex_stamp =gStore[symbol].ex_stamp;

    new_ohlc
        .slice()
        .reverse()
        .map( (element) => {
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

    let min_elder = [];

    new_ohlc
        .slice()
        .reverse()
        .map(element => {
            let temp_data = [];
            const index = process_day_data.findIndex(e => timeStamp_day(e.time) === timeStamp_day(element.time));
            if (ex_stamp === timeStamp_day(element.time)) {
                temp_data = [...process_day_data.slice(0, index), element];
            } else {
                temp_data = [...process_day_data.slice(0, index + 1), element];
            }
            min_elder = [...min_elder, elder(temp_data.reverse(), symbol).elder[0]];
        });
        
    return { ex_stamp, process_day_data, min_elder };
}

async function getOneData(options) {
    const { type, symbol } = options;
    let result;

    switch (type) {
        case 'elder':
            if (typeof gStore[symbol] === 'object') {       

                if (gStore[symbol].elderFlag === true) {
                    const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol });          
                    const data = colorsForday(ohlc, symbol);                
                    insertData({ data: data.min_elder, modelName: `${symbol}_elder`, type: 'elder' });
                
                    const colorsOfelder = getColorsForday(data.min_elder);
                    result = { ohlc: data.process_day_data, elder: colorsOfelder };
                    const check = data.min_elder.length === 0 ? true : false;
                    gStore[symbol] = { ex_stamp: data.ex_stamp, process_day_data: data.process_day_data, colorsOfelder, elderFlag: check };
                } else {
                    const ohlc_new = await getExistingData({ type: 'ohlc', modelName: symbol, limit: 5 });
   
                     const data_updated =  dataOnlineProcess(ohlc_new, symbol);
                     const min_elder = data_updated.min_elder;

           // -------------  database---------------
                    insertData({ data: min_elder.slice().reverse(), modelName: `${symbol}_elder`, type: 'elder' });
   
   
       //     ----------    min_elder -------->>>>>>   daily_elder       --------------
   
                    const day_elder = [...gStore[symbol].colorsOfelder];
                    const last_Elder = day_elder[day_elder.length-1];

                    min_elder
                    .slice()
                    .map(element => {
                        let temp_elder = day_elder[day_elder.length-1];
                        if(timeStamp_day(element.time) === timeStamp_day(temp_elder.time)){
                            day_elder.pop();
                            day_elder.push(element)
                        }else{
                            day_elder.push(element);
                        }
                    })
   
        //      finding changed daily_elder

                    const e_index = day_elder.findIndex(element => timeStamp_day(element.time) === timeStamp_day(last_Elder.time)  );
                    const changed_elder = day_elder.slice(e_index, day_elder.length);
                    
   
   
            ////           ---   ----     changed process_day_data   -------------
   
                    const old_process = [...gStore[symbol].process_day_data];
                    
                    const last_process = old_process[old_process.length-1];//previous top
                    
                    //finding changed process_day_data
                    const updated_process = data_updated.process_day_data;

                    const p_index = updated_process.findIndex(element => timeStamp_day(element.time) === timeStamp_day(last_process.time));
                    const changed_process = updated_process.slice(p_index, updated_process.length);

                    result = { ohlc: changed_process, elder: changed_elder};
    
                    gStore[symbol].process_day_data = updated_process;
        
                    gStore[symbol].ex_stamp = data_updated.ex_stamp;
                    gStore[symbol].colorsOfelder = day_elder;    
                }                 
            }
            
            break;
        default: result = []; break;
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
    let port = process.env.GRAPH_SERVER_PORT || 8020;
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

async function makeOnlineGraph(images) {
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
}


module.exports = {
    getHTML,
    makeGraph,
    getAllData,
    getOneData,
    makeOnlineGraph,
};
