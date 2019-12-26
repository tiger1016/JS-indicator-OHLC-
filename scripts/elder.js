const { insertData } = require('../db/models/dynamic');
const {
    calculateEMA,
    calculateMACD,
    getRecentEMA,
    getRecentMACD,
    getRecentTick,
    getExistingData,
} = require('../utils');

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
            const ohlcRows = await getExistingData({ type: 'ohlc', modelName: symbol });
            console.log('Total no of ohlcRows: ', ohlcRows.length);

            // technical indicators library expects the earliest data first. Thus reversing the data order. Only used for library
            const values = ohlcRows
                .slice()
                .reverse()
                .map(({ close }) => close);

            // We are reversing the EMA values returned as it would make calculations easier later
            const EMA = calculateEMA({ values }).reverse();
            const MACD = calculateMACD({ values })
                .map(({ histogram }) => histogram)
                .reverse();

            const elderDataRows = [];
            // We are using EMA array length here because the EMA period is greater than the MACD fast period [13>12].
            // This means that  EMA.length < MACD.length
            for (let i = 0; i < EMA.length - 1; i++) {
                if (
                    EMA[i] != undefined &&
                    EMA[i + 1] != undefined &&
                    MACD[i] != undefined &&
                    MACD[i + 1] != undefined
                ) {
                    elderDataRows.push({
                        time: ohlcRows[i].time,
                        symbol,
                        price: ohlcRows[i].close,
                        color: getPriceBarColor({
                            currentEMA: EMA[i],
                            prevEMA: EMA[i + 1],
                            currentMACD: MACD[i],
                            prevMACD: MACD[i + 1],
                        }),
                    });
                }
            }

            return elderDataRows;
        },
    },
};
