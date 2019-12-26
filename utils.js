const { EMA, MACD, RSI, SMA } = require('technicalindicators');
const axios = require('axios');
const dynamicModel = require('./db/models/dynamic');

function calculateMACD({ fastPeriod = 12, slowPeriod = 26, signalPeriod = 9, values }) {
    return MACD.calculate({ fastPeriod, slowPeriod, signalPeriod, values });
}

function calculateEMA({ period = 13, values }) {
    return EMA.calculate({ period, values });
}
function calculateSMA({ period, values }) {
    return SMA.calculate({ period, values });
}

function calculateRSI({ period = 14, values }) {
    return RSI.calculate({ period, values });
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

async function getRecentRSI({ symbol, interval = '1min', timePeriod = '14', seriesType = 'close' }) {
    const url = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=${seriesType}&apikey=${process.env.API_KEY}`;
    const { data } = await axios.get(url);
    return Object.entries(data[`Technical Analysis: RSI`]).map(x => ({ time: x[0], rsi: +x[1]['RSI'] }));
}

async function getRecentSMA({ symbol, interval = '1min', timePeriod = '14', seriesType = 'close' }) {
    const url = `https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=${seriesType}&apikey=${process.env.API_KEY}`;
    const { data } = await axios.get(url);
    return Object.entries(data[`Technical Analysis: SMA`]).map(x => ({ time: x[0], sma: +x[1]['SMA'] }));
}

async function getRecentTick({ symbol, interval = '1min', func = 'TIME_SERIES_INTRADAY' }) {
    const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&interval=${interval}&outputsize=compact&apikey=${process.env.API_KEY}`;
    const { data } = await axios.get(url);
    return Object.entries(data[`Time Series (${interval})`]).map(x => ({ time: x[0], close: +x[1]['4. close'] }));
}

async function getExistingData({ type, modelName }) {
    try {
        const model = dynamicModel.getModel({ type, modelName });
        const config = {
            order: [['time', 'DESC']],
            raw: true,
        };
        if (process.env.NUMBER_ROWS_SYNC) {
            config.limit = +process.env.NUMBER_ROWS_SYNC;
        }
        return model.findAll(config);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    getRecentEMA,
    getRecentMACD,
    calculateMACD,
    calculateEMA,
    calculateRSI,
    calculateSMA,
    getRecentRSI,
    getRecentTick,
    getRecentSMA,
    getExistingData
};
