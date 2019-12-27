const { insertData } = require('../db/models/dynamic');
const { getRecentRSI, getRecentTick, getExistingData, calculateRSI } = require('../utils');

module.exports = {
    insertData: async (data, symbol) => {
        return await insertData({ data, modelName: `${symbol}_rsi`, type: 'rsi' });
    },
    getData: {
        api: async symbol => {
            const [RSI, DATA] = await Promise.all([getRecentRSI({ symbol }), getRecentTick({ symbol })]);

            let dbRows = [
                {
                    time: DATA[0].time,
                    symbol,
                    price: DATA[0].close,
                    rsi: RSI[0].rsi,
                },
            ];
            return dbRows;
        },
        db: async symbol => {
            const ohlcRows = await getExistingData({ type: 'ohlc', modelName: symbol });
            console.log('Total no of ohlcRows: ', ohlcRows.length);

            // technical indicators library expects the earliest data first. Thus reversing the data order. Only used for library
            const values = ohlcRows
                .slice()
                .reverse()
                .map(({ close }) => close);

            // We are reversing the values returned as it would make calculations easier later
            const RSI = calculateRSI({ values }).reverse();

            const dbRows = [];
            for (let i = 0; i < RSI.length; i++) {
                dbRows.push({
                    time: ohlcRows[i].time,
                    symbol,
                    price: ohlcRows[i].close,
                    rsi: RSI[i],
                });
            }

            return dbRows;
        },
    },
};
