const EMA = require('technicalindicators').EMA;
const MACD = require('technicalindicators').MACD;
const axios = require('axios');
const dynamicModel = require('./db/models/dynamic');

function getPriceBarColor({ currentEMA, prevEMA, currentMACD, prevMACD }) {
    let color = 'Blue';
    if (currentEMA > prevEMA && currentMACD > prevMACD) {
        color = 'Green';
    }
    if (currentEMA < prevEMA && currentMACD < prevMACD) {
        color = 'Red';
    }
    // console.log(currentEMA, prevEMA, currentMACD, prevMACD, color);
    return color;
}

function calculateMACD({ fastPeriod = 12, slowPeriod = 26, signalPeriod = 9, values }) {
    return MACD.calculate({ fastPeriod, slowPeriod, signalPeriod, values });
}

function calculateEMA({ period = 13, values }) {
    return EMA.calculate({ period, values });
}

async function getRecentEMA({ symbol, interval = '1min', period = 13, series = 'close' }) {
    const url = `https://www.alphavantage.co/query?function=EMA&symbol=${symbol}&interval=${interval}&time_period=${period}&series_type=${series}&apikey=${process.env.API_KEY}`;
    const { data } = await axios.get(url);
    return Object.entries(data[`Technical Analysis: EMA`]).map(x => ({ time: x[0], ema: +x[1]['EMA'] }));
}

async function getRecentMACD({ symbol, interval = '1min', series = 'close' }) {
    const url = `https://www.alphavantage.co/query?function=MACD&symbol=${symbol}&interval=${interval}&series_type=${series}&apikey=${process.env.API_KEY}`;
    const { data } = await axios.get(url);
    return Object.entries(data[`Technical Analysis: MACD`]).map(x => ({ time: x[0], macd: +x[1]['MACD_Hist'] }));
}

async function insertElderRowData(data, symbol) {
    try {
        const model = dynamicModel.getElderModel(`${symbol}_elder`);
        return model.bulkCreate(data, {
            ignoreDuplicates: true,
        });
    } catch (err) {
        console.log(err);
    }
}

module.exports = { getRecentEMA, getRecentMACD, calculateMACD, calculateEMA, getPriceBarColor, insertElderRowData };
