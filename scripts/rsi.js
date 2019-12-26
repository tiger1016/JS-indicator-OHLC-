require('dotenv').config();

const argv = require('yargs').argv;
const { getRecentRSI, insertRSIRowData, getRecentTick, closeConnection } = require('../utils');

async function syncRSIDataFromApi(symbol) {
    const [RSI, DATA] = await Promise.all([getRecentRSI({ symbol }), getRecentTick({ symbol })]);

    let dbRows = [
        {
            time: DATA[0].time,
            symbol,
            price: DATA[0].close,
            rsi: RSI[0].rsi,
        },
    ];
    insertRSIRowData(dbRows, symbol);
}

const symbols = argv.symbol;
if (!symbols) {
    throw 'Symbol Not Provided';
}
[]
    .concat(symbols)
    .map(sym => String(sym).toLowerCase())
    .map(symbol => {
        syncRSIDataFromApi(symbol);
    });
