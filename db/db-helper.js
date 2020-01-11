const dynamicModel = require('./models/dynamic');

async function getExistingData({ type, modelName, limit = 5000 }) {
    let order = 'DESC';

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

module.exports = { getExistingData };
