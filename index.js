require('dotenv').config();
const argv = require('yargs').argv;
const scripts = require('./indicators');
const sequelize = require('./db/sequelize');

// Main code here
const symbols = argv.symbol;
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

[]
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
            console.log('Populating db rows. Please wait');
            await insertDataFn(data, symbol);
            console.log('Finished populating db rows');
            await sequelize.authenticate().then(async () => {
                console.log('Closing Connection.');
                await sequelize.close();
            });
            console.log('Connection closed');
            console.log('Task successful. Terminating');
        } catch (error) {
            console.log(error);
        }
    });
