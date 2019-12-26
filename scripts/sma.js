require('dotenv').config();

const argv = require('yargs').argv;
const { getRecentTick, getRecentSMA, insertSMARowData } = require('../utils');

async function syncSMADataFromApi(symbol) {
    const [SMA30, SMA50, DATA] = await Promise.all([
        getRecentSMA({ symbol, timePeriod: 30 }),
        getRecentSMA({ symbol, timePeriod: 50 }),
        getRecentTick({ symbol }),
    ]);

    let dbRows = [
        {
            time: DATA[0].time,
            symbol,
            price: DATA[0].close,
            sma30: SMA30[0].sma,
            sma50: SMA50[0].sma,
            value: Math.max(SMA50[0].sma, SMA30[0].sma),
        },
    ];
    insertSMARowData(dbRows, symbol);
}

const symbols = argv.symbol;
if (!symbols) {
    throw 'Symbol Not Provided';
}
[]
    .concat(symbols)
    .map(sym => String(sym).toLowerCase())
    .map(symbol => {
        syncSMADataFromApi(symbol);
    });
