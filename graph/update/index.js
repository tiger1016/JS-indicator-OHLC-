var crontab = require('node-crontab');

//  = = = = = = = = Node echarts   = = = = = = = = =
var node_echarts = require('./echart');
var path = require('path');

const { getExistingData } = require('../../db/db-helper');
const { insertData } = require('../../db/models/dynamic');

const {
    timeStamp_day,
    elder,
    colorsForday,
    getColorsForday,
} = require('./assist');

let num = 0;



///      -------------    Database connection   ---------------

const config = require('../../config/config.json')
const sequelize = require('../../db/sequelize');

const connection = async () => {
    return new Promise(resolve=> {
        sequelize.sequelize_ohlc.authenticate()
        .then(() => {
            console.log(`Connection established successfully with "${config.ohlc.DB_NAME}" db`);
            sequelize.sequelize_elder.authenticate()
                .then(() => {
                    console.log(`Connection established successfully with "${config.elder.DB_NAME}" db`);
                    resolve();
                })
                .catch(err => {
                    console.error(`Unable to connect to the database "${config.elder.DB_NAME}" db`);
                    sequelize.sequelize_ohlc.close();
                    sequelize.sequelize_elder.close();
                    resolve();
                });
        })
        .catch(err => {
            console.error(`Unable to connect to the database "${config.ohlc.DB_NAME}" db`);
            sequelize.sequelize_ohlc.close();
            resolve();
        });
    }) 
}


////--------------           default option        -----------------

const colors = {
    Blue: '#4447ff',
    Red: '#fe4856',
    Green: '#92e98a',
};

const defaultOptions = {
    backgroundColor: '#011426',
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
        },
    },
    grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
    },
    yAxis: {
        scale: true,
        axisLine: { lineStyle: { color: '#8392A5' } },
         splitLine: { show: false }
    },

};

var gStore = {};

// =====       ==========          Function Definition  =========       ==============
function calculateEMA(data, dayCount) {
    let result = [];
    const multiplier = 2 / (dayCount + 1);
    let ema = data.slice(0, dayCount).reduce((a, b) => a + +b[1], 0) / dayCount;
    for (let i = 0, len = data.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        } else if (i == dayCount) {
            result.push(ema);
            continue;
        } else {
            ema = data[i][1] * multiplier + ema * (1 - multiplier);
            result.push(ema);
        }
    }
    return result;
}



async function getAllData(options) {
    const { type, symbol } = options;
    let result;
    switch (type) {
        case 'elder':
            const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol });
            
            if (ohlc.length === 0) {
                result = { ohlc: [], elder: [] };
            } else {
                const data = colorsForday(ohlc, symbol);
                if (data.min_elder.length !== elder.length) {
                    insertData({ data: data.min_elder, modelName: `${symbol}_elder`, type: 'elder' });
                }
                const colorsOfelder = getColorsForday(data.min_elder);
                result = { ohlc: data.process_day_data, elder: colorsOfelder };
                const check = data.min_elder.length === 0 ? true : false;
                
                gStore[symbol] = { ex_stamp: data.ex_stamp, process_day_data: data.process_day_data, colorsOfelder, elderFlag: check };
            }

            break;
        default:
            result = [];
    }
    return result;
}

const dataOnlineProcess = (new_ohlc, symbol) => {
    let process_day_data = [...gStore[symbol].process_day_data];
    let ex_stamp = gStore[symbol].ex_stamp;

    new_ohlc
        .slice()
        .reverse()
        .map( (element) => {
            if (ex_stamp !== timeStamp_day(element.time)) {
                ex_stamp = timeStamp_day(element.time);
                process_day_data.push(element);
            } else {
                var temp = process_day_data.pop();
                temp.time = element.time;
                temp.high = Math.max(temp.high, element.high);
                temp.low = Math.min(temp.low, element.low);
                temp.close = element.close;
                process_day_data.push(temp);
                ex_stamp = timeStamp_day(element.time);
            }
        });

    let min_elder = [];

    new_ohlc
        .slice()
        .reverse()
        .map(element => {
            let temp_data = [];
            const index = process_day_data.findIndex(e => timeStamp_day(e.time) === timeStamp_day(element.time));
            if (ex_stamp === timeStamp_day(element.time)) {
                temp_data = [...process_day_data.slice(0, index), element];
            } else {
                temp_data = [...process_day_data.slice(0, index + 1), element];
            }
            min_elder = [...min_elder, elder(temp_data.reverse(), symbol).elder[0]];
        });
        
    return { ex_stamp, process_day_data, min_elder };
}

async function getOneData(options) {
    console.log(`getOneData - > ${++num} step`)
    const { type, symbol } = options;
    let result;

    switch (type) {
        case 'elder':
            if (typeof gStore[symbol] === 'object') {       

                if (gStore[symbol].elderFlag === true) {
                    const ohlc = await getExistingData({ type: 'ohlc', modelName: symbol });          
                    const data = colorsForday(ohlc, symbol);                
                    insertData({ data: data.min_elder, modelName: `${symbol}_elder`, type: 'elder' });
                
                    const colorsOfelder = getColorsForday(data.min_elder);
                    result = { ohlc: data.process_day_data, elder: colorsOfelder };
                    const check = data.min_elder.length === 0 ? true : false;
                    gStore[symbol] = { ex_stamp: data.ex_stamp, process_day_data: data.process_day_data, colorsOfelder, elderFlag: check };
                } else {
                    const ohlc_new = await getExistingData({ type: 'ohlc', modelName: symbol, limit: 5 });
   
                     const data_updated =  dataOnlineProcess(ohlc_new, symbol);
                     const min_elder = data_updated.min_elder;

           // -------------  database---------------
                    insertData({ data: min_elder.slice().reverse(), modelName: `${symbol}_elder`, type: 'elder' });
   
   
       //     ----------    min_elder -------->>>>>>   daily_elder       --------------
   
                    const day_elder = [...gStore[symbol].colorsOfelder];
                    const last_Elder = day_elder[day_elder.length-1];

                    min_elder
                    .slice()
                    .map(element => {
                        let temp_elder = day_elder[day_elder.length-1];
                        if(timeStamp_day(element.time) === timeStamp_day(temp_elder.time)){
                            day_elder.pop();
                            day_elder.push(element)
                        }else{
                            day_elder.push(element);
                        }
                    })
   
        //      finding changed daily_elder

                    const e_index = day_elder.findIndex(element => timeStamp_day(element.time) === timeStamp_day(last_Elder.time)  );
                    const changed_elder = day_elder.slice(e_index, day_elder.length);//return data   including same day and nex day  
                    
   
   
            ////           ---   ----     changed process_day_data   -------------
   
                    const old_process = [...gStore[symbol].process_day_data];
                    
                    const last_process = old_process[old_process.length-1];//previous top
                    
                    //finding changed process_day_data
                    const updated_process = data_updated.process_day_data;

                    const p_index = updated_process.findIndex(element => timeStamp_day(element.time) === timeStamp_day(last_process.time));
                    const changed_process = updated_process.slice(p_index, updated_process.length);

                    result = { ohlc: changed_process, elder: changed_elder};
    
                    gStore[symbol].process_day_data = updated_process;
        
                    gStore[symbol].ex_stamp = data_updated.ex_stamp;
                    gStore[symbol].colorsOfelder = day_elder;    
                }                 
            }
            
            break;
        default: result = []; break;
    }
    
    return result;
}

async function getNewData( symbol ) {
  
    console.log(`getNewData - > ${++num} step`)

    await getOneData({type: 'elder', symbol});

     let { process_day_data, colorsOfelder } = gStore[symbol];
    //  let { ohlc, elder } = gStore[symbol];
    let ohlc = [...process_day_data]
    let elder = [...colorsOfelder]
    
    let ohlcObj = {};
    let ohlcData = [];
    let categoryData = [];
    let elderData = [];

    ohlc.forEach(ohlc => {
        ohlcObj[ohlc['time']] = [ohlc.open, ohlc.close, ohlc.low, ohlc.high];
    });
    elder.forEach(elder => {
        let time = elder['time'];
        categoryData.push(new Date(time).toLocaleDateString("en-US"));
        ohlcData.push(ohlcObj[time]);
        elderData.push({
            value: ohlcObj[time],
            itemStyle: {
                color: colors[elder['color']],
                color0: colors[elder['color']],
                borderColor: '#555',
                borderColor0: '#555',
            },
        });
    });
    return {
        categoryData,
        elderData,
        ohlcData,
    };
}



/////     ----------------          File Read     ---------------
 const fs = require('fs');
 const util = require('util');
 const pos = "./config/readSymbols.txt";          
 var symbols = [];

 const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');


async function read_File () {

      await connection();

      const data = await readFile(pos);
      symbols = data.split("\r\n");
      console.log(symbols);


      console.log(`  readfile step - > ${++num} step `)


    const promisesAll = symbols.map(async symbol => {
        console.log(`  GetAlldata step - > ${++num}, ${symbol} `);
        await getAllData({type: 'elder', symbol});
    })

    await Promise.all(promisesAll);
    


    var obj = {
        a: "World"
    };
    
    var jobId = crontab.scheduleJob("*/1 * * * *", function(){
    
        symbols.map(async  symbol  => {

            // console.log(gStore[`${symbol}`])
            // console.log(gStore[symbol])
            
            const data =  await getNewData(symbol);
    
       //  = = = = = =   option   = = = = = = = =
    
            option = {
                ...defaultOptions,
    
                title: {
                    text: "elder",
                },
                xAxis: {
                    type: 'category',
                    data: data.categoryData,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false, lineStyle: { color: '#8392A5' } },
                    splitNumber: 20,
                    min: 'dataMin',
                    max: 'dataMax',
                },
                series: [
                    {
                        name: 'Elder',
                        type: 'candlestick',
                        data: data.elderData,
                    },
                    {
                        name: 'EMA13',
                        type: 'line',
                        data: calculateEMA(data.ohlcData, 13),
                        smooth: false,
                        lineStyle: {
                            normal: { opacity: 0.5, color: '#1d528b' },
                        },
                        showSymbol: false,
                    },
                ],
            };
            
            node_echarts({
                path: './output/' + `${symbol}` + `.png`,
                option,
                width:  800,
                height: 500
            })
    
    
        });
    
        //  await Promise.all(promises);
    
     
    }, null, obj);
    




}


//               =  = = = = = =   **     Code start     **   = = = = = = = = =


read_File();  



