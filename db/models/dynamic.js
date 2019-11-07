const { Model, DataTypes } = require('sequelize')
const sequelize = require('../sequelize')

function getOHLCModel(modelName) {
    const model = sequelize.define(modelName, {
        close: DataTypes.DOUBLE,
        time: DataTypes.DATE,
    })
    model.removeAttribute('id')
    return model
}
function getElderModel(modelName) {
    const model = sequelize.define(modelName, {
        time: { type: DataTypes.DATE, primaryKey: true },
        symbol: DataTypes.STRING,
        price: DataTypes.DOUBLE,
        color: DataTypes.STRING,
    })
    model.removeAttribute('id')
    model.sync()
    return model
}

module.exports = { getOHLCModel, getElderModel }
