const Sequelize = require('sequelize')
const config = require('../config/config.json');

const sequelize_ohlc = new Sequelize(config.ohlc.DB_NAME, config.ohlc.DB_USER, config.ohlc.DB_PASS, {
    host: config.ohlc.DB_HOST,
    dialect: 'mysql',
    define: {
        timestamps: false,
        freezeTableName: true,
    },
    logging: false,
    dialectOptions: {
        timezone:'+07:00'
    },
})

const sequelize_elder = new Sequelize(config.elder.DB_NAME, config.elder.DB_USER, config.elder.DB_PASS, {
    host: config.elder.DB_HOST,
    dialect: 'mysql',
    define: {
        timestamps: false,
        freezeTableName: true,
    },
    logging: false,
    dialectOptions: {
        timezone:'+07:00'
    },
})

module.exports = {
    sequelize_ohlc,
    sequelize_elder,
}
