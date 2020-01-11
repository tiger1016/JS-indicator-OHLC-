require('@tensorflow/tfjs-node');
const { EMA, MACD, RSI, SMA } = require('technicalindicators');

function calculateMACD({ fastPeriod = 12, slowPeriod = 26, signalPeriod = 9, values }) {
    return MACD.calculate({ fastPeriod, slowPeriod, signalPeriod, values });
}

function calculateEMA({ period = 13, values }) {
    return EMA.calculate({ period, values });
}
function calculateSMA({ period, values }) {
    return SMA.calculate({ period, values });
}

function calculateRSI({ period = 14, values }) {
    return RSI.calculate({ period, values });
}

async function delay(delayInms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
}
module.exports = {
    calculateMACD,
    calculateEMA,
    calculateRSI,
    calculateSMA,
};
