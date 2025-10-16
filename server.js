// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies from requests
app.use(express.json());

// --- Database Connection ---
// MongoDB URI is loaded from .env file (MONGO_URI variable)
const DB_URI = process.env.MONGO_URI || 'mongodb+srv://<db_username>:<db_password>@todo.vrscbqp.mongodb.net/todo_app?retryWrites=true&w=majority';
console.log('Connecting to MongoDB using .env MONGO_URI...');

mongoose.connect(DB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.log('Server will continue running without database connection');
        console.log('Please check: 1) Username/password 2) IP whitelist 3) Database permissions');
    });

// --- Mongoose Schema & Model ---
const TodoSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});

const Todo = mongoose.model('Todo', TodoSchema);

// --- API Routes ---

// Serve the frontend HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET all tasks (Read)
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Todo.find().sort({ createdAt: -1 }); 
        res.json(tasks);
    } catch (err) {
        // Log the actual error on the server side
        console.error("Error fetching tasks:", err.message);
        // Send a generic 500 error response to the client
        res.status(500).json({ message: "Failed to retrieve tasks due to server error." });
    }
});

// POST (Create) a new task
app.post('/api/tasks', async (req, res) => {
    // Input validation check
    if (!req.body.text || req.body.text.trim() === "") {
         return res.status(400).json({ message: "Task text is required." });
    }
    
    const task = new Todo({ text: req.body.text });
    try {
        const newTask = await task.save();
        res.status(201).json(newTask); // 201 Created
    } catch (err) {
        console.error("Error creating task:", err.message);
        res.status(400).json({ message: err.message }); // 400 Bad Request if validation fails
    }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const result = await Todo.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error("Error deleting task:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});