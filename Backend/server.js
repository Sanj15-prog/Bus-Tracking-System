const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Attach socket to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Routes
const busRoutes = require('./routes/busRoutes');
app.use('/api/buses', busRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); // ✅ ONLY THIS (important)

// ❌ REMOVED THIS (causing issue)
// app.use('/', authRoutes);

// ✅ Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ✅ Socket events
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('updateLocation', (data) => {
    io.emit('locationUpdate', data);
  });

  socket.on('busEvent', (data) => {
    console.log("SERVER RECEIVED BUS EVENT:", data);
    io.emit('busEvent', data);
  });

  socket.on('updateStatus', (data) => {
    io.emit('statusUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ✅ Start server
app.get("/", (req, res) => {
  res.send("Backend is working");
})
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

