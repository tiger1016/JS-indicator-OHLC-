$(document).ready(function() {
    // state
    charts = [];
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
        // legend: {
        //     data: ['Elder'],
        //     inactiveColor: '#777',
        //     textStyle: {
        //         color: '#fff',
        //     },
        // },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '15%',
        },
        yAxis: {
            scale: true,
            axisLine: { lineStyle: { color: '#8392A5' } },
            // splitLine: { show: false }
        },
        dataZoom: [
            {
                type: 'inside',
                start: 1, // Where to start displaying Data (percentage)
                end: 100, //
            },
            {
                show: true,
                type: 'slider',
                y: '90%',
            },
        ],
    };

    function calculateMA(data, dayCount) {
        let result = [];
        for (let i = 0, len = data.length; i < len; i++) {
            if (i < dayCount) {
                result.push('-');
                continue;
            }
            let sum = 0;
            for (let j = 0; j < dayCount; j++) {
                sum += +data[i - j][1];
            }
            result.push(sum / dayCount);
        }
        return result;
    }

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

    async function getData({ symbol }) {
        const data = await (await fetch(`data?type=elder&symbol=${symbol}`)).json();
        let { ohlc, elder } = data;
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

    function getPriceBarColor({ currentEMA, prevEMA, currentMACD, prevMACD }) {
        let color = 'Blue';
        if (currentEMA > prevEMA && currentMACD > prevMACD) {
            color = 'Green';
        }
        if (currentEMA < prevEMA && currentMACD < prevMACD) {
            color = 'Red';
        }
        
        return color;
    }

    async function dataProcess(ohlc_new) {
        ohlc = JSON.parse(localStorage.getItem('ohlc'));
        ema = JSON.parse(localStorage.getItem('ema'));
        macd = JSON.parse(localStorage.getItem('macd'));
        elder = JSON.parse(localStorage.getItem('elder'));

        const dayCount = 13;
        const multiplier = 2 / (dayCount + 1);
      
        if (timeStamp_day(ohlc[0].time) === timeStamp_day(ohlc_new.time)) {
            ohlc[0].time = ohlc_new.time;
            ohlc[0].close = ohlc_new.close;
            ohlc[0].high = Math.max(ohlc[0].high, parseInt(ohlc_new.high));
            ohlc[0].low = Math.min(ohlc[0].low, parseInt(ohlc_new.low));

            ema[0] = ohlc_new.close * multiplier + ema[0] * (1 - multiplier);

            macd[0] = macd[0] + ohlc_new.close - ohlc[dayCount - 1].close;

            elder[0] = {
                time: ohlc_new.time,
                symbol: 'spy',
                price: ohlc_new.close,
                color: getPriceBarColor({
                    currentEMA: ema[0],
                    prevEMA: ema[1],
                    currentMACD: macd[0],
                    prevMACD: macd[1],
                }),
            };
        } else {            
            ema = [ohlc_new.close * multiplier + ema[0] * (1 - multiplier), ...ema];

            macd = [macd[0] + ohlc_new.close - ohlc[dayCount - 1].close, ...macd];

            elder = [{
                time: ohlc_new.time,
                symbol: 'spy',
                price: ohlc_new.close,
                color: getPriceBarColor({
                    currentEMA: ema[0],
                    prevEMA: ema[1],
                    currentMACD: macd[0],
                    prevMACD: macd[1],
                }),
            }, ...elder];

            ohlc = [ohlc_new, ...ohlc];
            ema.pop();
            macd.pop();
        }

        /*ohlc_min = JSON.parse(localStorage.getItem('ohlc_min'));

        if (timeStamp_min(ohlc_min[0].time) !== timeStamp_min(ohlc_new.time)) {
            fetch('insert', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time: ohlc_new.time,
                    symbol: 'spy',
                    close: ohlc_new.close,
                    color: ohlc[0].color
                })              
            }).then(res => {
                if (res === 'ok') {
                    ohlc_min = [ohlc_new, ...ohlc_min];
                    ohlc_min.pop();
                    localStorage.setItem('ohlc_min', JSON.stringify(ohlc_min));
                }
            })
        }
        */
        localStorage.setItem('ohlc', JSON.stringify(ohlc));
        localStorage.setItem('ema', JSON.stringify(ema));
        localStorage.setItem('macd', JSON.stringify(macd));
        localStorage.setItem('elder', JSON.stringify(elder));

        return { ohlc: ohlc.reverse(), elder: elder.reverse() };
    }

    async function getUpdatedData() {
        const ohlc_new = await (await fetch(`data?type=elder&symbol=spy&cond=one`)).json();
        
        const { ohlc, elder } = await dataProcess(ohlc_new);
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

    async function updateData() {
        charts.forEach(async ({ chart, symbol }) => {
            chart.showLoading({
                text: 'Loading graph. Please wait',
            });
            const data = await getUpdatedData();
            const option = {
                ...defaultOptions,
                title: {
                    text: symbol,
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
                        // smooth: true,
                        lineStyle: {
                            normal: { opacity: 0.5, color: '#1d528b' },
                        },
                        showSymbol: false,
                    },
                ],
            };

            chart.setOption(option, true);
            chart.hideLoading();
        });
    }

    const timeStamp_day = time => 
        time.substr(0, 10);
    
    const timeStamp_min = time => 
        time.substr(0, 16);

    function init() {
        console.log('Main script executed');
        const chartEls = document.getElementsByClassName('chart');
        let symbol;
        for (let chartEl of chartEls) {
            symbol = chartEl.getAttribute('symbol');
            let chart = echarts.init(chartEl);

            $(window).on('resize', function() {
                if (chart != null && chart != undefined) {
                    chart.resize();
                }
            });
            charts.push({ chart, symbol });
        }

        fetch(`data?type=elder&symbol=spy&cond=all`)
            .then(response => response.json())
            .then(data => {     

                const ohlcToStore = JSON.stringify(data.ohlc);
                const emaToStore = JSON.stringify(data.ema);
                const macdToStore = JSON.stringify(data.macd);
                const elderToStore = JSON.stringify(data.elder);

                localStorage.setItem('ohlc', ohlcToStore);
                localStorage.setItem('ema', emaToStore);
                localStorage.setItem('macd', macdToStore);
                localStorage.setItem('elder', elderToStore);
                
                updateData();
                setInterval(updateData, 40000); 
            })               
    }
    init();
});
