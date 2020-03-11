const { calculateMACD, calculateEMA } = require('../../utils');

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

function getPriceBarColor({ currentEMA, prevEMA, currentMACD, prevMACD }) {
    let color = 'Blue';
    if (currentEMA > prevEMA && currentMACD > prevMACD) {
        color = 'Green';
    }
    if (currentEMA < prevEMA && currentMACD < prevMACD) {
        color = 'Red';
    }
    
    return color;
}

const elder = (data, symbol) => {
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
                symbol,
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

const timeStamp_day = time => 
    time.toUTCString().slice(0, 17);
const timeStamp_min = time =>
    time.toUTCString().slice(20,28)
const timeStamp_hour = time =>
    time.toUTCString().slice(17,19)

const colorsForday = (ohlc, symbol) => {
    var process_day_data = [];
    var ex_stamp = '';
    var temp_array = [];

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
                ex_stamp = timeStamp_day(element.time);
                if (index === ohlc.length - 1) {
                    process_day_data.push(convertTimeframe(temp_array));
                }
            }
        });
        
    var min_elder = [];
    ohlc
        .slice()
        .reverse()
        .map(element => {
            var temp_data = [];
            const index = process_day_data.findIndex(e => timeStamp_day(e.time) === timeStamp_day(element.time));
            if (ex_stamp === timeStamp_day(element.time)) {
                temp_data = [...process_day_data.slice(0, index), element];
            } else {
                temp_data = [...process_day_data.slice(0, index + 1), element];
            }
            const dataForCheck = elder(temp_data.reverse(), symbol).elder[0];
            if (typeof dataForCheck !== "undefined") {
                min_elder = [...min_elder, dataForCheck];
            }
        });

    return { ex_stamp, process_day_data, min_elder };
}

const getColorsForday = elder => {
    const elder_res = [];
    if (elder.length !== 0) {
        var ex_stamp = timeStamp_day(elder[0].time);
        for (var i = 0; i < elder.length; i ++) {
            if (timeStamp_day(elder[i].time) !== ex_stamp) {
                elder_res.push(elder[i - 1]);
                ex_stamp = timeStamp_day(elder[i].time);
            }
        }
        elder_res.push(elder[elder.length - 1]);
    }

    return elder_res;
}



module.exports = {
    timeStamp_day,
    convertTimeframe,
    elder,
    getPriceBarColor,
    colorsForday,
    getColorsForday,
}