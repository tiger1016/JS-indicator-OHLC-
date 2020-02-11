const ma_period=13;          // Period of MA
const fast_ema_period = 12;  // MACD fast period 
const slow_ema_period = 26;  // MACD slow period
const signal_period=9;       // MACD signal period

const timeStamp_day = time => 
    time.toUTCString().slice(0, 17);

const elder_min = (data, elder_color) => {
 
    const limit = data.length;     

    var elder = [];

    var rates_total = limit, prev_calculated = 0;
    
    var Price = data
        .slice()
        .reverse()
        .map(({close}) => +close);
        
    var MA = ExponentialMAOnBuffer(rates_total,prev_calculated,0,ma_period,Price);
    var FASTMACD = ExponentialMAOnBuffer(rates_total,prev_calculated,0,fast_ema_period,Price);
    var SLOWMACD = ExponentialMAOnBuffer(rates_total,prev_calculated,0,slow_ema_period,Price);
    var MACDM = [];
    for(var i= 0; i < limit; i++) MACDM[i]=FASTMACD[i]-SLOWMACD[i];

    var MACDS = SimpleMAOnBuffer(rates_total,prev_calculated,0,signal_period,MACDM);

    var begin = slow_ema_period;
    var ohlc_color = data.slice().reverse();
    var ohlc = data;
    for (var bar = begin; bar < elder_color.length; bar++) {        
        const pos1 = ohlc_color.findIndex(e => timeStamp_day(e.time) === timeStamp_day(elder_color[bar].time));
        const pos2 = ohlc.findIndex(e => timeStamp_day(e.time) === timeStamp_day(elder_color[bar].time));       
        for (var j = pos1; j <= ohlc.length - pos2 - 1; j++) {
            Price[bar]     = ohlc_color[j].close;
            MA[bar]        = ExponentialMA(ma_period,MA[bar-1],Price[bar]);
            FASTMACD[bar]  = ExponentialMA(fast_ema_period,FASTMACD[bar-1],Price[bar]);
            SLOWMACD[bar]  = ExponentialMA(slow_ema_period,SLOWMACD[bar-1],Price[bar]);
            MACDM[bar]     = FASTMACD[bar]-SLOWMACD[bar];
            MACDS[bar]     = SimpleMA(bar,signal_period,MACDS[bar-1],MACDM);                
            
            var dma     = MA[bar]-MA[bar-1];
            var dmacd0  = MACDM[bar]-MACDS[bar];
            var dmacd1  = MACDM[bar-1]-MACDS[bar-1];
            var color = '';
            if (dma>0 && dmacd0 > dmacd1 && dmacd0>0) color = 'Green'; // Green
            else if(dma<0 && dmacd0 < dmacd1 && dmacd0<0) color = 'Red'; // Red
            else color = 'Blue';
            elder.push({
                time: ohlc_color[j].time,
                symbol: 'spy',
                price: ohlc_color[j].close,
                color: color
            })
        }
    }
    return elder.reverse();
}

 
function SimpleMA(position, period, prev_value, price)
{
    const result= prev_value +(price[position]-price[position-period])/period;;
    return result;
}

function ExponentialMA(period, prev_value, price)
{
    var pr=2.0/(period+1.0);
    const result=price*pr+prev_value*(1-pr);
    return result;
}

function SimpleMAOnBuffer(rates_total, prev_calculated, begin, period, price)
{
    var buffer = [];
    var limit=period+begin;

    for(var i=0;i<limit-1;i++) buffer[i]=0.0;
    
    var firstValue=0;
    for(var i=begin;i<limit;i++)
        firstValue+=price[i];
    firstValue/=period;
    buffer[limit-1]=firstValue;

   for(var i=limit;i<rates_total;i++)
      buffer[i]=buffer[i-1]+(price[i]-price[i-period])/period;

    return buffer;
}

function ExponentialMAOnBuffer(rates_total, prev_calculated, begin, period, price)
{
    var buffer = [];    
    var dSmoothFactor=2.0/(1.0+period); 

    var limit=period+begin;

    for(var i=0;i<begin;i++) buffer[i]=0.0;
    buffer[begin]=price[begin];

    for(var i=begin+1;i<limit;i++)
        buffer[i]=price[i]*dSmoothFactor+buffer[i-1]*(1.0-dSmoothFactor);
   
   for(var i=limit;i<rates_total;i++)
      buffer[i]=price[i]*dSmoothFactor+buffer[i-1]*(1.0-dSmoothFactor);

    return buffer;
}

module.exports = elder_min;