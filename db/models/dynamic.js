const { Model, DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

async function closeConnection() {
    return sequelize.close();
}

function getOHLCModel(modelName) {
    const model = sequelize.define(modelName, {
        close: DataTypes.DOUBLE,
        time: DataTypes.DATE,
    });
    model.removeAttribute('id');
    return model;
}
function getElderModel(modelName) {
    const model = sequelize.define(modelName, {
        time: { type: DataTypes.DATE, primaryKey: true },
        symbol: DataTypes.STRING,
        price: DataTypes.DOUBLE,
        color: DataTypes.STRING,
    });
    model.removeAttribute('id');
    model.sync();
    return model;
}

function getRSIModel(modelName) {
    const model = sequelize.define(modelName, {
        time: { type: DataTypes.DATE, primaryKey: true },
        symbol: DataTypes.STRING,
        price: DataTypes.DOUBLE,
        rsi: DataTypes.DOUBLE,
    });
    model.removeAttribute('id');
    model.sync();
    return model;
}

function getSMAModel(modelName) {
    const model = sequelize.define(modelName, {
        time: { type: DataTypes.DATE, primaryKey: true },
        symbol: DataTypes.STRING,
        price: DataTypes.DOUBLE,
        sma30: DataTypes.DOUBLE,
        sma50: DataTypes.DOUBLE,
        value: DataTypes.DOUBLE,
    });
    model.removeAttribute('id');
    model.sync();
    return model;
}
module.exports = { closeConnection, getOHLCModel, getElderModel, getRSIModel, getSMAModel };
