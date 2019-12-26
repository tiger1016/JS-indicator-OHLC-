require('dotenv').config();

const argv = require('yargs').argv;
const axios = require('axios');
const sequelize = require('../../db/sequelize');
const dynamicModel = require('../../db/models/dynamic');
const {
    calculateEMA,
    calculateMACD,
    getRecentEMA,
    getRecentMACD,
    getPriceBarColor,
    insertElderRowData,
} = require('../../utils');

async function getExistingData(symbol) {
    try {
        const model = dynamicModel.getOHLCModel(symbol);
        const config = {
            order: [['time', 'DESC']],
            raw: true,
        };
        if (process.env.NUMBER_ROWS_SYNC) {
            config.limit = +process.env.NUMBER_ROWS_SYNC;
        }
        return model.findAll(config);
    } catch (err) {
        console.log(err);
    }
}

// This function syncs certain number of rows as specified in .env file NUMBER_ROWS_SYNC params.
async function syncElderDataFromDB(symbol) {
    const ohlcRows = await getExistingData(symbol);
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
        if (EMA[i] != undefined && EMA[i + 1] != undefined && MACD[i] != undefined && MACD[i + 1] != undefined) {
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
    console.log('Populating db rows. Please wait');
    await insertElderRowData(elderDataRows, symbol);
    console.log('Finished populating db rows.Closing Connection');
    await sequelize.close();
    console.log('Task successful. Terminating');
}

const symbol = argv.symbol;
if (!symbol) {
    throw 'Symbol Not Provided';
}

[]
    .concat(symbol)
    .map(sym => String(sym).toLowerCase())
    .map(symbol => {
        syncElderDataFromDB(symbol);
    });
