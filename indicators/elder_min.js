const { insertData } = require('../db/models/dynamic');
const { getRecentEMA, getRecentMACD, getRecentTick } = require('../api');
const { getExistingData } = require('../db/db-helper');

const { convertTimeframe, timeStamp_day, elder } = require('../graph/controller/assist');

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
            const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol });
            console.log('Total no of ohlcRows: ', ohlc.length);

            // technical indicators library expects the earliest data first. Thus reversing the data order. Only used for library

            var process_day_data = [];
            var ex_stamp = '';
            var temp_array = [];
            var result_min_elder = [];

            ohlc
                .slice()
                .reverse()
                .map(( element, index ) => {
                    if (ex_stamp !== timeStamp_day(element.time)) {
                        if (ex_stamp !== '') {
                            process_day_data.push(convertTimeframe(temp_array));
                            ex_stamp = timeStamp_day(element.time);
                            temp_array = [];
                            temp_array.push(element);
                            if (index === ohlc.length - 1) process_day_data.push(convertTimeframe(temp_array));
                            
                        } else {
                            ex_stamp = timeStamp_day(element.time);
                            temp_array.push(element);
                        }
                    } else {
                        temp_array.push(element);
                        if (index === ohlc.length - 1) {
                            process_day_data.push(convertTimeframe(temp_array));
                        }
                    }
                });

                ohlc
                .slice()
                .reverse()
                .map(element => {
                    const index = process_day_data.findIndex(e => timeStamp_day(e.time) === timeStamp_day(element.time));
                    const temp_data = [...process_day_data.slice(0, index + 1), element];
                    result_min_elder = [...result_min_elder, elder(temp_data.reverse()).elder[0]];
                });
                
            return result_min_elder.reverse();
        },
    },
};
