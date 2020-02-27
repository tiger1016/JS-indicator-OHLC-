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
        // dataZoom: [
        //     {
        //         type: 'inside',
        //         start: 1, // Where to start displaying Data (percentage)
        //         end: 100, //
        //     },
        //     {
        //         show: true,
        //         type: 'slider',
        //         y: '90%',
        //     },
        // ],
    };

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

    async function getOneData({ symbol }) {
        const data = await (await fetch(`data?type=elder&symbol=${symbol}&cond=one`)).json();
        console.log(`get One Data `)
        
        console.log(data);

        const ohlc_data=[...data.ohlc];
        const elder_data=[...data.elder];

       const store = JSON.parse(localStorage.getItem('store'));       
    
        if (store[symbol].elder.length === 0) {
            if (elder_data.length !== 0) {
                store[symbol].ohlc = [...ohlc_data];
                store[symbol].elder = [...elder_data];
            }
        } else {
            store[symbol].ohlc.pop();
            store[symbol].elder.pop();
       
            store[symbol].ohlc.push(ohlc_data);
            store[symbol].elder.push(elder_data);
        }

        console.log(store[symbol]);

        localStorage.setItem('store', JSON.stringify(store));
     
        let { ohlc, elder } = store[symbol];
        
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
        const promises = charts.map(async ({ chart, symbol }) => {
            // chart.showLoading({
            //     text: 'Loading graph. Please wait',
            // });
            const data = await getOneData({ symbol });
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
            
            // chart.hideLoading();
        });

        await Promise.all(promises);

        const images = [];
        const e_chartEls = document.getElementsByClassName('chart');
        for (let chartEl of e_chartEls) {
            let symbol = chartEl.getAttribute('symbol');
            let canvas = chartEl.querySelector('canvas');
            images.push({ symbol, url: canvas.toDataURL() });
        }

        setTimeout(() => {
            fetch('drawing', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(images)
            })
        }, 15000);
    }

    async function init() {
        console.log('Main script executed');
        const chartEls = document.getElementsByClassName('chart');

        for (let chartEl of chartEls) {
            let symbol = chartEl.getAttribute('symbol');
            let chart = echarts.init(chartEl);

            $(window).on('resize', function() {
                if (chart != null && chart != undefined) {
                    chart.resize();
                }
            });
            charts.push({ chart, symbol });
        }

        localStorage.clear();
        
        let store = {};
        const promises = charts.map(async ({ symbol }) => {
            const data = await (await fetch(`data?type=elder&symbol=${symbol}&cond=all`)).json();
            store[symbol] = data;    
        })
        
        await Promise.all(promises);
        
        localStorage.setItem('store', JSON.stringify(store));

        updateData();
        setInterval(updateData, 60000);
    }

    init();
});
