require('dotenv').config()

const argv = require('yargs').argv
const axios = require('axios')

const {
    calculateEMA,
    calculateMACD,
    getRecentEMA,
    getRecentMACD,
    getPriceBarColor,
    insertElderRowData,
} = require('./utils')

async function getRecentTick({ symbol, interval = '1min', func = 'TIME_SERIES_INTRADAY' }) {
    const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&interval=${interval}&outputsize=compact&apikey=${process.env.API_KEY}`
    const { data } = await axios.get(url)
    return Object.entries(data[`Time Series (${interval})`]).map(x => ({ time: x[0], close: +x[1]['4. close'] }))
}

// This function inserts only the latest tick value aka inserts only 1 row
async function syncElderDataFromApi(symbol) {
    const [EMA, MACD, DATA] = await Promise.all([
        getRecentEMA({ symbol }),
        getRecentMACD({ symbol }),
        getRecentTick({ symbol }),
    ])

    insertElderRowData(
        [
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
        ],
        symbol
    )
}

const symbols = argv.symbol
if (!symbols) {
    throw 'Symbol Not Provided'
}
;[]
    .concat(symbols)
    .map(sym => String(sym).toLowerCase())
    .map(symbol => {
        syncElderDataFromApi(symbol)
    })
