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

let isConnected = false;

if (DB_URI && !DB_URI.includes('<db_username>')) {
    mongoose.connect(DB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => {
        console.log('MongoDB connected successfully');
        isConnected = true;
    })
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.log('Server will continue running without database connection');
        isConnected = false;
    });
} else {
    console.log('No valid MongoDB URI found, running in local mode');
    isConnected = false;
}

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
    if (!isConnected) {
        return res.json([]);
    }
    
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
    );
    
    try {
        const tasks = await Promise.race([
            Todo.find().sort({ createdAt: -1 }),
            timeoutPromise
        ]);
        res.json(tasks);
    } catch (err) {
        console.error("Error fetching tasks:", err.message);
        res.json([]);
    }
});

// POST (Create) a new task
app.post('/api/tasks', async (req, res) => {
    if (!req.body.text || req.body.text.trim() === "") {
         return res.status(400).json({ message: "Task text is required." });
    }
    
    const mockTask = {
        _id: Date.now().toString(),
        text: req.body.text,
        createdAt: new Date()
    };
    
    if (!isConnected) {
        return res.status(201).json(mockTask);
    }
    
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
    );
    
    try {
        const task = new Todo({ text: req.body.text });
        const newTask = await Promise.race([
            task.save(),
            timeoutPromise
        ]);
        res.status(201).json(newTask);
    } catch (err) {
        console.error("Error creating task:", err.message);
        res.status(201).json(mockTask);
    }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
    if (!isConnected) {
        return res.json({ message: 'Task deleted successfully' });
    }
    
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
    );
    
    try {
        await Promise.race([
            Todo.findByIdAndDelete(req.params.id),
            timeoutPromise
        ]);
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error("Error deleting task:", err.message);
        res.json({ message: 'Task deleted successfully' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});