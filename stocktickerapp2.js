// Import necessary modules
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from a .env file (for local development)
dotenv.config();

// Initialize the app
const app = express();
const port = process.env.PORT || 3000; // Heroku assigns a dynamic port

// MongoDB Atlas connection URI (from environment variable)
const uri = process.env.MONGO_URI;

// MongoDB client initialization
const client = new MongoClient(uri);

const dbName = 'Stock';
const collectionName = 'PublicCompanies';

// Middleware to parse form data (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to MongoDB
let db, collection;
client.connect()
  .then(() => {
    db = client.db(dbName);
    collection = db.collection(collectionName);
    console.log('MongoDB connected');
  })
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Home Route (View 1) - The form to search by company name or ticker symbol
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Stock Search</title>
      </head>
      <body>
        <h1>Search for a Stock</h1>
        <form method="GET" action="/process">
          <label for="searchQuery">Enter Company Name or Ticker Symbol:</label>
          <input type="text" id="searchQuery" name="searchQuery" required>

          <br><br>

          <label for="searchTicker">Search by Ticker Symbol:</label>
          <input type="radio" id="searchTicker" name="searchType" value="ticker" required>

          <label for="searchCompany">Search by Company Name:</label>
          <input type="radio" id="searchCompany" name="searchType" value="company">

          <br><br>

          <button type="submit">Search</button>
        </form>
      </body>
    </html>
  `);
});

// Process Route (View 2) - Handles the form submission, queries the database, and shows results in the console
app.get('/process', async (req, res) => {
  const { searchQuery, searchType } = req.query;

  if (!searchQuery) {
    return res.send("No search query provided.");
  }

  let searchCriteria;

  // Determine whether we're searching by company name or ticker symbol
  if (searchType === 'ticker') {
    searchCriteria = { ticker: searchQuery };
  } else if (searchType === 'company') {
    searchCriteria = { company: { $regex: searchQuery, $options: 'i' } }; // Case-insensitive search
  }

  try {
    // Query MongoDB
    const results = await collection.find(searchCriteria).toArray();

    if (results.length > 0) {
      // Display results in the console
      console.log('Search Results:');
      results.forEach((result) => {
        console.log(`Company: ${result.company}, Ticker: ${result.ticker}, Price: $${result.price}`);
      });
      res.send('Search complete! Check the console for results.');
    } else {
      console.log('No results found for your search.');
      res.send('No results found.');
    }
  } catch (err) {
    console.error('Error during search:', err);
    res.send('Error occurred during search.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
