Notes.

To run the scripts execute the command npm start -- --symbol="<symbol-name> --type="<[elder/rsi/sma]>" --action="<[db/api]>". Both the script inserts row if none was present. If a row already exists, the script ignores that value.

Action Types
api : Intented to be run every minute to sync the Table values
db : Intented to be run once to fill in the missing data points in Table Values.
Script Types
elder: FOr calculating elder values
rsi: Populates the rsi values
sma: Compares the 30 vs 50 period sma and tabulates the larger value.
You can also send multiple symbols like this. For eg: npm start -- --symbol="SPY" --symbol="MSFT"

Examples
npm start -- --symbol="SPY" --symbol="MSFT" --type="sma" --action="db" npm start -- --symbol="SPY" --type="elder" --action="api" npm start -- --symbol="SPY" --type="rsi" --action="db"

<<<<<<< HEAD
Db and api-key config is stored in the .env file.

/////////////////////////////////////////////////// Here is the commands:

spec: symbol might be spy, dia, qqq ....

npm start -- --symbol="spy" --type="elder" --action="db"

All update: npm start -- --symbol="all" --type="elder" --action="db"

=======
DB and api-key config is stored in the .env file.

///////////////////////////////////////////////////
Here are the commands:

spec: symbol might be spy, dia, qqq ....

    npm start -- --symbol="spy" --type="elder" --action="db"

All update: 
    npm start -- --symbol="all" --type="elder" --action="db"
    
>>>>>>> 098d2c6735a9a4a166e61e9a2b8d04463a75237c
Graph display and output saving:

    npm run start-graph-server

<<<<<<< HEAD
database update command:(should install more node modules: npm install node-crontab canvas echarts)

    npm run start-update

If you want to run with symbols-file, then please Input all symbols you want into "/config/readSymbols.txt" file, like as below:

                                            spy
                                            dia
                                            qqq
                                            ppp
                                            ......
=======

If you want to run with symbols-file, then please Input all symbols you want into "/config/readSymbols.txt" file, like as below:

                                                spy
                                                dia
                                                qqq
                                                ppp
                                                ......
                                                
                                                
### Carriage Return changes for Linux:

./graph/controller/index.js   <-- change line 31 to symbols = data.split("\n");

./index.js                    <-- change line 67 to symbols = data.split("\n");



### Hide lines from chart

go to main.js in graph/scripts to jump in 32 line

then you will see splitLine: { show: true }

change it as {show: false}

that the result of 32 line is " splitLine: { show: false }"
>>>>>>> 098d2c6735a9a4a166e61e9a2b8d04463a75237c
