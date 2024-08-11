const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://suvisk:suvisk@suvisk.emrlxdt.mongodb.net/?retryWrites=true&w=majority&appName=suvisk")
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schemas
const questionSchema = new mongoose.Schema({
    question: String,
    a: String,
    b: String,
    c: String,
    d: String,
    correct: String
});

const scoreSchema = new mongoose.Schema({
    username: String,
    department: String,
    score: Number
});

// Create Models
const Question = mongoose.model('Question', questionSchema);
const Score = mongoose.model('Score', scoreSchema);

// API Endpoints

// Get all quiz questions and delete them after retrieval
app.get('/api/quiz', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
        await Question.deleteMany({});
        console.log('Questions deleted after retrieval');
    } catch (err) {
        res.status(500).json({ message: 'Error fetching questions' });
    }
});

// Add a new quiz question
app.post('/api/quiz', async (req, res) => {
    const { question, a, b, c, d, correct } = req.body;
    if (!question || !a || !b || !c || !d || !correct) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const newQuestion = new Question({ question, a, b, c, d, correct });
        await newQuestion.save();
        res.status(201).json({ message: 'Question added successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding question' });
    }
});

// Submit a score
app.post('/api/quiz/score', async (req, res) => {
    const { username, department, score } = req.body;
    if (!username || !department || score === undefined) {
        return res.status(400).json({ message: 'Username, department, and score are required' });
    }
    try {
        const newScore = new Score({ username, department, score });
        await newScore.save();
        res.status(201).json({ message: 'Score submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting score' });
    }
});

// Get all scores
app.get('/api/quiz/scores', async (req, res) => {
    try {
        const scores = await Score.find();
        res.json(scores);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching scores' });
    }
});

// Serve static files from the 'client' directory
app.use(express.static('client'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
