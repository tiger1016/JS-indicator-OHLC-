const calculateMA = (data, dayCount=13) => {
    let result = [];
    for (let i = 0, len = data.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        }
        let sum = 0;
        for (let j = 0; j < dayCount; j++) {
            sum += +data[i - j][1];
        }
        result.push(sum / dayCount);
    }
    return result;
}

const calculateEMA = (data, dayCount=13) => {
    let result = [];
    const multiplier = 2 / (dayCount + 1);
    let ema = data.slice(0, dayCount).reduce((a, b) => a + +b[1], 0) / dayCount;
    for (let i = 0, len = data.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        } else if (i == dayCount) {
            result.push(ema);
            continue;
        } else {
            ema = data[i][1] * multiplier + ema * (1 - multiplier);
            result.push(ema);
        }
    }
    return result;
}


module.exports ={
    calculateEMA,
    calculateMA
}