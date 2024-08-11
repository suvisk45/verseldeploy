const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Create Models
const Question = mongoose.model('Question', questionSchema);
const Score = mongoose.model('Score', scoreSchema);
const User = mongoose.model('User', userSchema);

// Middleware for authentication
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// API Endpoints

// User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Get all quiz questions and delete them after retrieval
app.get('/api/quiz', authMiddleware, async (req, res) => {
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
app.post('/api/quiz', authMiddleware, async (req, res) => {
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
