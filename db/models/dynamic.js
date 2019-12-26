const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
let models = {
    ohlc: modelName => {
        return sequelize.define(modelName, {
            close: DataTypes.DOUBLE,
            time: DataTypes.DATE,
        });
    },
    elder: modelName => {
        return sequelize.define(modelName, {
            time: { type: DataTypes.DATE, primaryKey: true },
            symbol: DataTypes.STRING,
            price: DataTypes.DOUBLE,
            color: DataTypes.STRING,
        });
    },
    rsi: modelName => {
        return sequelize.define(modelName, {
            time: { type: DataTypes.DATE, primaryKey: true },
            symbol: DataTypes.STRING,
            price: DataTypes.DOUBLE,
            rsi: DataTypes.DOUBLE,
        });
    },
    sma: modelName => {
        return sequelize.define(modelName, {
            time: { type: DataTypes.DATE, primaryKey: true },
            symbol: DataTypes.STRING,
            price: DataTypes.DOUBLE,
            sma30: DataTypes.DOUBLE,
            sma50: DataTypes.DOUBLE,
            value: DataTypes.DOUBLE,
        });
    },
};

function getModel({ type, modelName }) {
    let modelFn = models[type];
    if (!modelFn) {
        throw `Model not fount`;
    }
    let model = modelFn(modelName);
    model.removeAttribute('id');
    model.sync();
    return model;
}

async function insertData({ data, type, modelName }) {
    try {
        const model = getModel({ type, modelName });
        return model.bulkCreate(data, {
            ignoreDuplicates: true,
        });
    } catch (err) {
        console.log(err);
    }
}
module.exports = { getModel, insertData };
