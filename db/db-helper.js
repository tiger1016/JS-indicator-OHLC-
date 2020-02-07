const dynamicModel = require('./models/dynamic');

async function getExistingData({ type, modelName, limit = 100000, order = 'DESC' }) {
    try {
        const model = dynamicModel.getModel({ type, modelName });
        const config = {
            order: [['time', order]],
            raw: true,
            limit,
        };
        return model.findAll(config);
    } catch (err) {
        console.log(err);
    }
}

async function getNewData({ type, modelName }) {
    try {
        const model = dynamicModel.getModel({ type, modelName });
        const config = {
            order: [['time', 'DESC']],
            raw: true
        };
        return model.findOne(config);
    } catch (err) {
        console.log(err);
    }
}

async function insertOneData({ data, modelName, type }) {
    try {
        const model = dynamicModel.getModel({ type, modelName });
        model.upsert(data);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { 
    getExistingData,
    getNewData,
    insertOneData
};
