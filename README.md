Notes.

To run the scripts execute the command `npm run <script-name> -- --symbol="<symbol-name>`. 
Both the script inserts row if none was present. If a row already exists, the script ignores that value.
// elder
1. sync-api : Intented to be run every minute to sunc the Elder Table values
2. sync-db : Intented to be run once to fill in the missing data points in Elder Table Values.

3. rsi: Populates the rsi values
4. sma: Compares the 30 vs 50 period sma and tabulates the larger value.

You can also send multiple symbols like this. For eg:
`npm run sync-db -- --symbol="SPY" --symbol="MSFT"`


Db and api-key config is stored in the .env file.
The `NUMBER_ROWS_SYNC` variable is used to determine how many data points to sync while using data from database
