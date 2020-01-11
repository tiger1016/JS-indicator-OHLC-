const controller = require('./controller');

controller.makeGraph().then(symbols => {
    console.log(`Images made for ${symbols}`);
});
