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


const timeStamp_day = time => 
    time.toUTCString().slice(0, 17);


module.exports = {
    timeStamp_day,
    convertTimeframe,
    elder,
    getPriceBarColor
}