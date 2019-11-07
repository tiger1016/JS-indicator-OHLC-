Notes.

There are two scripts. To run the scripts execute the command `npm run <script-name> -- --symbol="<symbol-name>`. 
Both the script inserts row if none was present. If a row already exists, the script ignores that value.

1. sync-api : Intented to be run every minute to sunc the Elder Table values
2. sync-db : Intented to be run once to fill in the missing data points in Elder Table Values.

You can also send multiple symbols like this. For eg:
`npm run sync-db -- --symbol="SPY" --symbol="MSFT"`


Db and api-key config is stored in the .env file.
The `NUMBER_ROWS_SYNC` variable is used to determine how many data points to sync while using data from database
