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

const convertTimeframe = input => {
    let opens = [],
        highs = [],
        lows = [],
        closes = [];

    for (let j = 0; j < input.length; j++) {
        let elem = input[j];
        let o = elem.open;
        let h = elem.high;
        let l = elem.low;
        let c = elem.close;
        if (o > 0 && o !== null) opens.push(o);
        if (h > 0 && h !== null) highs.push(h);
        if (l > 0 && l !== null) lows.push(l);
        if (c > 0 && c !== null) closes.push(c);
    }

    let lastElem = input[input.length - 1];

    return {          
        open: opens[0],
        high: Math.max.apply( Math, highs ),
        low: Math.min.apply( Math, lows ),
        close: lastElem.close,
        time: lastElem.time,
    };
}

const elder = data => {
    const values = data
        .slice()
        .reverse()
        .map(( {close }) => +close);

    const ema = calculateEMA({ values }).reverse();
    const macd = calculateMACD({ values })
        .map(({ histogram }) => histogram)
        .reverse();

    const elder = [];
    for (let i = 0; i < ema.length - 1; i++) {
        if (
            ema[i] != undefined &&
            ema[i + 1] != undefined &&
            ema[i] != undefined &&
            ema[i + 1] != undefined
        ) {
            elder.push({
                time: data[i].time,
                symbol: 'spy',
                price: data[i].close,
                color: getPriceBarColor({
                    currentEMA: ema[i],
                    prevEMA: ema[i + 1],
                    currentMACD: macd[i],
                    prevMACD: macd[i + 1],
                }),
            });
        }
    }

    return { ema, macd, elder };
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
                        } else {
                            ex_stamp = timeStamp_day(element.time);
                            temp_array.push(element);
                        }
                    } else {
                        temp_array.push(element);
                        if (index === ohlc.length -1) process_day_data.push(convertTimeframe(temp_array));
                    }
                });
            
            var i = 0;
            const result = elder(process_day_data.reverse());
            
            ohlc
                .slice()
                .map(element => {
                    if (result.elder[i] && timeStamp_day(element.time) === timeStamp_day(result.elder[i].time)) {
                            result_min_elder.push({
                                time: element.time,
                                symbol: 'spy',
                                price: element.close,
                                color: result.elder[i].color
                            })
                    } else {
                        i++;
                        if (result.elder[i]) {
                                result_min_elder.push({
                                        time: element.time,
                                        symbol: 'spy',
                                        price: element.close,
                                        color: result.elder[i].color
                                    })
                            }
                    }
                })

            return result_min_elder;
        },
    },
};
