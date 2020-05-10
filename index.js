require('dotenv').config();
const argv = require('yargs').argv;
const scripts = require('./indicators');
const sequelize = require('./db/sequelize');
const config = require('./config/config.json');
const fs = require('fs');

// Main code here
var symbols = argv.symbol;
const scriptType = argv.type;
const action = argv.action;
let validScriptTypes = Object.keys(scripts);
let validActions = ['db', 'api'];

// invalid case handling
if (!symbols) {
    throw 'Symbol Not Provided';
}
if (!scriptType || !validScriptTypes.includes(scriptType)) {
    throw `Invalid type. Type must be one of the following: ${validScriptTypes}`;
}
if (!action || !validActions.includes(action)) {
    throw `Invalid action. Type must be one of the following: ${validActions}`;
}

const run = async (symbols) => {
    const a = []
        .concat(symbols)
        .map(sym => String(sym).toLowerCase())
        .map(async symbol => {
            try {
                let executor = scripts[scriptType];
                let insertDataFn = executor.insertData;
                let getDataFn = executor.getData[action];
                if (!getDataFn || !insertDataFn) {
                    throw `Logic for ${action}-${scriptType} not implemented`;
                }
                const data = await getDataFn(symbol);
                console.log(`Populating "${symbol}_elder" table rows. Please wait`);
                await insertDataFn(data, symbol);
                console.log(`Finished populating "${symbol}_elder" table rows`);
            } catch (error) {
                console.log(error);
            }
        });
        
    await Promise.all(a);

    await sequelize.sequelize_ohlc.authenticate()
        .then(async () => {                
            await sequelize.sequelize_ohlc.close();
            console.log(`Connection closed successfully with "${config.ohlc.DB_NAME}" db`);                      
        })
    await sequelize.sequelize_elder.authenticate()
        .then(async () => {
            console.log(`Connection closed successfully with "${config.elder.DB_NAME}" db`);
            await sequelize.sequelize_elder.close();                            
        })
    console.log('Task successful. Terminating');
}

if (typeof symbols === "string" && symbols === "all") {
    const pos = "./config/readSymbols.txt";
    fs.exists(pos, exist => {
        if (exist) {
            fs.readFile(pos, "utf8", (err, data) => {
                symbols = data.split("\r\n");
                console.log(symbols);
                run(symbols);   
            })
        }
    })
} else {
    run(symbols);
}