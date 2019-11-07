const Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
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
module.exports = sequelize
