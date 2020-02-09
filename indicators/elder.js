const { insertData } = require('../db/models/dynamic');
const { calculateEMA, calculateMACD } = require('../utils');
const { getRecentEMA, getRecentMACD, getRecentTick } = require('../api');
const { getExistingData } = require('../db/db-helper');

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

const timeStamp_day = time => 
    time.toUTCString().slice(0, 17);


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
            console.log('Total no of ohlcRows: ', ohlc.length);

            // technical indicators library expects the earliest data first. Thus reversing the data order. Only used for library
            var ex_stamp = '';
            var temp_array = [];
            var elder = [];
            
            ohlc
            .slice()
            .reverse()
            .map(( element, index ) => {
                if (ex_stamp !== timeStamp_day(element.time)) {                        
                    if (ex_stamp !== '') {
                        // We are reversing the EMA values returned as it would make calculations easier later
                        temp_array.reverse();
                        const values = temp_array
                            .slice()
                            .reverse()
                            .map(({close}) => +close);

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
                                    time: temp_array[i].time,
                                    symbol,
                                    price: temp_array[i].close,
                                    color: getPriceBarColor({
                                        currentEMA: EMA[i],
                                        prevEMA: EMA[i + 1],
                                        currentMACD: MACD[i],
                                        prevMACD: MACD[i + 1],
                                    }),
                                });
                            }
                        }
                        elder = [...elderDataRows, ...elder];
                        ex_stamp = timeStamp_day(element.time);
                        temp_array = [];
                        temp_array.push(element);
                    } else {
                        ex_stamp = timeStamp_day(element.time);
                        temp_array.push(element);
                    }
                } else {
                    temp_array.push(element);
                    if (index === ohlc.length -1) {
                        temp_array.reverse();
                        const values = temp_array
                            .slice()
                            .reverse()
                            .map(({close}) => +close);

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
                                    time: temp_array[i].time,
                                    symbol,
                                    price: temp_array[i].close,
                                    color: getPriceBarColor({
                                        currentEMA: EMA[i],
                                        prevEMA: EMA[i + 1],
                                        currentMACD: MACD[i],
                                        prevMACD: MACD[i + 1],
                                    }),
                                });
                            }
                        }
                        elder = [...elderDataRows, ...elder];
                    }
                }
            });      

            return elder;
        },
    },
};
