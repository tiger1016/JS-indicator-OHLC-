const { insertData } = require('../db/models/dynamic');
const { getRecentEMA, getRecentMACD, getRecentTick } = require('../api');
const { getExistingData } = require('../db/db-helper');
const { getPriceBarColor, colorsForday } = require('../graph/controller/assist');

module.exports = {
    insertData: async (data, symbol) => {
        return await insertData({ data, modelName: `${symbol}_elder`, type: 'elder' });
    },
    getData: {
        api: async symbol => {
            const [EMA, MACD, DATA] = await Promise.all([
                getRecentEMA({ symbol }),
                getRecentMACD({ symbol }),
                getRecentTick({ symbol }),
            ]);

            let dbRows = [
                {
                    time: DATA[0].time,
                    symbol,
                    price: DATA[0].close,
                    color: getPriceBarColor({
                        currentEMA: EMA[0],
                        prevEMA: EMA[1],
                        currentMACD: MACD[0],
                        prevMACD: MACD[1],
                    }),
                },
            ];
            return dbRows;
        },
        db: async symbol => {
            const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol });
            console.log('Total No of ohlcRows: ', ohlc.length);

            // technical indicators library expects the earliest data first. Thus reversing the data order. Only used for library
            
            const { min_elder } = colorsForday(ohlc, symbol);

            return min_elder.reverse();
        },
    },
};
