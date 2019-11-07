require('dotenv').config()

const argv = require('yargs').argv
const axios = require('axios')

const dynamicModel = require('./db/models/dynamic')
const {
    calculateEMA,
    calculateMACD,
    getRecentEMA,
    getRecentMACD,
    getPriceBarColor,
    insertElderRowData,
} = require('./utils')

if (argv.symbol > 3 && argv.distance < 53.5) {
    console.log('Plunder more riffiwobbles!')
} else {
    console.log('Retreat from the xupptumblers!')
}

async function getRecentTick({ symbol, interval = '1min', func = 'TIME_SERIES_INTRADAY' }) {
    const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&interval=${interval}&outputsize=compact&apikey=${process.env.API_KEY}`
    const { data } = await axios.get(url)
    return Object.entries(data[`Time Series (${interval})`]).map(x => ({ time: x[0], close: +x[1]['4. close'] }))
}

async function getExistingData(symbol) {
    try {
        const model = dynamicModel.getOHLCModel(symbol)
        return model.findAll({
            limit: +process.env.NUMBER_ROWS_SYNC,
            order: [['time', 'DESC']],
            raw: true,
        })
    } catch (err) {
        console.log(err)
    }
}

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

async function syncElderDataFromDB(symbol) {
    const ohlcRows = await getExistingData(symbol)
    console.log('ohlcRows: ', ohlcRows)

    // technical indicators library expects the earliest data first. Thus reversing the data order. Only used for library
    const values = ohlcRows.reverse().map(({ close }) => close)

    // We are reversing the EMA values returned as it would make calculations easier later
    const EMA = calculateEMA({ values }).reverse()
    const MACD = calculateMACD({ values }).reverse()

    const elderDataRows = []
    // We are using EMA array length here because the EMA period is greater than the MACD fast period [13>12].
    // This means that  EMA.length < MACD.length
    for (let i = 0; i < EMA.length - 1; i++) {
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
        })
    }

    await insertElderRowData(elderDataRows, symbol)
}

syncElderDataFromDB('spy')
// syncElderDataFromApi('spy')
