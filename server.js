const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS module
const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
const corsOptions = {
    origin: 'https://jkoeb8762.github.io', // Allow only your GitHub Pages domain
    optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Body-parser middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define a schema for the game scores
const ScoreSchema = new mongoose.Schema({
    name: String,
    score: Number
});

const Score = mongoose.model('Score', ScoreSchema);

// Routes
app.post('/scores', async (req, res) => {
    const { name, score } = req.body;
    const newScore = new Score({ name, score });
    try {
        const savedScore = await newScore.save();
        res.status(201).send(savedScore);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.get('/scores', async (req, res) => {
    try {
        const scores = await Score.find().sort({score: -1}).limit(5);
        res.json(scores);
    } catch (error) {
        res.status(500).send("Error retrieving scores: " + error.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.delete('/clear-scores', async (req, res) => {
    try {
        await Score.deleteMany({});
        res.status(200).send("Leaderboard cleared successfully.");
    } catch (error) {
        res.status(500).send("Error clearing leaderboard: " + error.message);
    }
});
