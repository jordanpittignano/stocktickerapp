import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// set up everything
const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'Stock';
const collectionName = 'PublicCompanies';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// connect to Mongo
let db, collection;
client.connect()
  .then(() => {
    db = client.db(dbName);  // Use db() instead of database()
    collection = db.collection(collectionName);
    console.log('MongoDB connected');
  })
  .catch((err) => console.error('Error connecting to MongoDB:', err));

app.get('/', (req, res) => {
    // html below with search bar, radio buttons, and submit button
    res.send(`
        <html>
            <head>
                    <title>Stock Ticker</title>
            </head>
            <body>
                    <h1 style="font-family: 'Lora', serif; font-size: 40px">Stock Ticker App 2</h1>
                    <form method="GET" action="/process">
                        <label for="searched">Enter a company name or ticker here:</label>
                        <input type="text" id="searched" name="searched" required>
                        <br><br>
                        <label for="searchTicker">Select if you inputted a ticker</label>
                        <input type="radio" id="searchTicker" name="searchType" value="ticker" required>
                        <br>
                        <br>
                        <label for="searchCompany">Select if you inputted a company name</label>
                        <input type="radio" id="searchCompany" name="searchType" value="company">
                        <br>
                        <br>
                        <br>
                        <button type="submit">Submit</button>
                    </form>
            </body>
        </html>
  `);
});

// process
app.get('/process', async (req, res) => {
    const { searched, searchType } = req.query;

    if (!searched) {
        return res.send("No search query provided.");
    }

    let searchSpecific;

    // ticker versus company
    if (searchType === 'ticker') {
        searchSpecific = { ticker: searched };
    } else if (searchType === 'company') {
        searchSpecific = { company: { $regex: searched, $options: 'i' } };
    }

    try {
        const results = await collection.find(searchSpecific).toArray();

        if (results.length > 0) {
            // search results
            console.log('Search Results:');
            results.forEach((result) => {
                console.log(`Company: ${result.company}, Ticker: ${result.ticker}, Price: $${result.price}`);
            });
            
            // end the results to console
            res.send(`
                <html>
                    <head><title>Search Results</title></head>
                    <body>
                        <h1>Search Results</h1>
                        <p>Check the console for your results!</p>
                        <script>
                            const searchResults = ${JSON.stringify(results)};
                            searchResults.forEach(result => {
                                console.log('Company:', result.company);
                                console.log('Ticker:', result.ticker);
                                console.log('Price: $' + result.price);
                            });
                        </script>
                    </body>
                </html>
            `);
        } else {
            console.log('No results found.');
            res.send('No results found.');
        }
    } catch (err) {
        console.error('Error during search:', err);
        res.send('Error occurred during search.');
    }
});

// local
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
