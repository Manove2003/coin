require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define Coin schema and model, specifying the collection name
const coinSchema = new mongoose.Schema({
  userId: String,
  coins: [String],
}, { collection: 'quiz-coins' });

const Coin = mongoose.model('Coin', coinSchema);

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
}));

// Get all coins for a user
app.get('/:user_id/coins', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const userCoins = await Coin.findOne({ userId });

    if (!userCoins) {
      return res.json({ coins: [] });
    }

    res.json({ coins: userCoins.coins });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add coins for a user
app.post('/:user_id/coins', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const { coin } = req.body;

    if (!coin) {
      return res.status(400).json({ error: 'Coin data is required' });
    }

    let userCoins = await Coin.findOne({ userId });

    if (!userCoins) {
      userCoins = new Coin({ userId, coins: [coin] });
    } else {
      userCoins.coins.push(coin);
    }

    await userCoins.save();
    res.status(201).json({ coins: userCoins.coins });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update coins for a user
app.put('/:user_id/coins', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const { coins } = req.body;

    if (!Array.isArray(coins)) {
      return res.status(400).json({ error: 'Coins data must be an array' });
    }

    let userCoins = await Coin.findOne({ userId });

    if (!userCoins) {
      userCoins = new Coin({ userId, coins });
    } else {
      userCoins.coins = coins;
    }

    await userCoins.save();
    res.status(200).json({ coins: userCoins.coins });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});