const { insertData } = require('../db/models/dynamic');
const { calculateEMA } = require('../utils');
const { getRecentEMA, getRecentTick } = require('../api');
const { getExistingData } = require('../db/db-helper');

module.exports = {
    insertData: async (data, symbol) => {
        return await insertData({ data, modelName: `${symbol}_ema`, type: 'ema' });
    },
    getData: {
        api: async symbol => {
            const [SMA30, SMA50, DATA] = await Promise.all([
                getRecentEMA({ symbol, timePeriod: 30 }),
                getRecentEMA({ symbol, timePeriod: 50 }),
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
            const SMA30 = calculateEMA({ values, period: 30 }).reverse();
            const SMA50 = calculateEMA({ values, period: 50 }).reverse();

            // sma50 will have less points as it has more period.
            const dbRows = [];
            for (let i = 0; i < SMA50.length; i++) {
                dbRows.push({
                    time: ohlcRows[i].time,
                    symbol,
                    price: ohlcRows[i].close,
                    sma30: SMA30[i],
                    sma50: SMA50[i],
                    value: Math.max(SMA50[i], SMA30[i]),
                });
            }

            return dbRows;
        },
    },
};
