Notes.

To run the scripts execute the command `npm start -- --symbol="<symbol-name> --type="<[elder/rsi/sma]>" --action="<[db/api]>"`. 
Both the script inserts row if none was present. If a row already exists, the script ignores that value.

Action Types
-------------
1. api : Intented to be run every minute to sync the Table values
2. db : Intented to be run once to fill in the missing data points in Table Values.

Script Types
1. elder: FOr calculating elder values
2. rsi: Populates the rsi values
3. sma: Compares the 30 vs 50 period sma and tabulates the larger value.

You can also send multiple symbols like this. For eg:
`npm start -- --symbol="SPY" --symbol="MSFT"`


Db and api-key config is stored in the .env file.
The `NUMBER_ROWS_SYNC` variable is used to determine how many data points to sync while using data from database
