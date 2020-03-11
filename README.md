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

Db and api-key config is stored in the .env file.

/////////////////////////////////////////////////// Here is the commands:

spec: symbol might be spy, dia, qqq ....

npm start -- --symbol="spy" --type="elder" --action="db"

All update: npm start -- --symbol="all" --type="elder" --action="db"

Graph display and output saving:

    npm run start-graph-server

database update command:(should install more node modules: npm install node-crontab canvas echarts)

    npm run start-update

If you want to run with symbols-file, then please Input all symbols you want into "/config/readSymbols.txt" file, like as below:

                                            spy
                                            dia
                                            qqq
                                            ppp
                                            ......