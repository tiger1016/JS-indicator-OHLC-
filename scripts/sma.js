const { insertData } = require('../db/models/dynamic');
const { getRecentSMA, getRecentTick, getExistingData } = require('../utils');

module.exports = {
    insertData: async (data, symbol) => {
        return await insertData({ data, modelName: `${symbol}_elder`, type: 'elder' });
    },
    getData: {
        api: async symbol => {
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
            return dbRows;
        },
        // db: async symbol => {
        //     const ohlcRows = await getExistingData({ type: 'ohlc', modelName: symbol });
        //     console.log('Total no of ohlcRows: ', ohlcRows.length);

        //     // technical indicators library expects the earliest data first. Thus reversing the data order. Only used for library
        //     const values = ohlcRows
        //         .slice()
        //         .reverse()
        //         .map(({ close }) => close);

        //     // We are reversing the EMA values returned as it would make calculations easier later
        //     const EMA = calculateEMA({ values }).reverse();
        //     const MACD = calculateMACD({ values })
        //         .map(({ histogram }) => histogram)
        //         .reverse();

        //     const elderDataRows = [];
        //     // We are using EMA array length here because the EMA period is greater than the MACD fast period [13>12].
        //     // This means that  EMA.length < MACD.length
        //     for (let i = 0; i < EMA.length - 1; i++) {
        //         if (
        //             EMA[i] != undefined &&
        //             EMA[i + 1] != undefined &&
        //             MACD[i] != undefined &&
        //             MACD[i + 1] != undefined
        //         ) {
        //             elderDataRows.push({
        //                 time: ohlcRows[i].time,
        //                 symbol,
        //                 price: ohlcRows[i].close,
        //                 color: getPriceBarColor({
        //                     currentEMA: EMA[i],
        //                     prevEMA: EMA[i + 1],
        //                     currentMACD: MACD[i],
        //                     prevMACD: MACD[i + 1],
        //                 }),
        //             });
        //         }
        //     }

        //     return elderDataRows;
        // },
    },
};
