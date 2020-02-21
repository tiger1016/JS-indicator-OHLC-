const { DataTypes } = require('sequelize');
const { sequelize_ohlc, sequelize_elder } = require('../sequelize');

let models = {
    ohlc: modelName => {
        return sequelize_ohlc.define(modelName, {
            open: DataTypes.DOUBLE,
            high: DataTypes.DOUBLE,
            low: DataTypes.DOUBLE,
            close: DataTypes.DOUBLE,
            time: DataTypes.DATE,
        });
    },
    elder: modelName => {
        return sequelize_elder.define(modelName, {
            time: { type: DataTypes.DATE, primaryKey: true },
            symbol: DataTypes.STRING,
            price: DataTypes.DOUBLE,
            color: DataTypes.STRING,
        });
    },
};

function getModel({ type, modelName }) {
    let modelFn = models[type];
    if (!modelFn) {
        throw `Model:${modelName} not found`;
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
