const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bus = require('../models/Bus');



// ===================== REGISTER =====================
router.post('/register', async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const { name, email, password, role, preferredRoute } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    let assignedBus = null;
    let accountStatus = 'Active';

    // ✅ Student → Pending approval
    if (role === 'Student') {
      accountStatus = 'Pending';
    }

    const user = new User({
      name,
      email,
      password,
      role,
      assignedBus,
      preferredRoute,
      accountStatus
    });

    await user.save();

    res.status(201).json({
      message: "Registered successfully",
      accountStatus
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================== LOGIN =====================
router.post('/login', async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password, role } = req.body;

    const user = await User.findOne({ email, password, role }).populate('assignedBus');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or role mismatch' });
    }

    if (user.accountStatus === 'Pending') {
      return res.status(403).json({ error: 'Account pending approval by admin.' });
    }

    // ✅ Attach route purely from Mongo document parameters
    const route = user.assignedBus && user.assignedBus.source
      ? { from: user.assignedBus.source, to: user.assignedBus.destination }
      : null;

    res.status(200).json({
      ...user.toObject(),
      route
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================== ADMIN =====================

// ✅ Get pending students
router.get('/pending-students', async (req, res) => {
  try {
    const students = await User.find({
      role: 'Student',
      accountStatus: 'Pending'
    });

    console.log("PENDING STUDENTS:", students);

    res.status(200).json(students);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Approve student + assign bus
router.put('/approve-student', async (req, res) => {
  try {
    console.log("APPROVE BODY:", req.body);

    const { userId, busNumber } = req.body;

    if (!userId || !busNumber) {
      return res.status(400).json({ error: "userId and busNumber are required" });
    }

    // 🔍 Find bus
    const bus = await Bus.findOne({ busNumber });
    console.log("FOUND BUS:", bus);

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // 🔍 Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        assignedBus: bus._id,
        accountStatus: 'Active'
      },
      { new: true }
    ).populate('assignedBus');

    console.log("UPDATED USER:", user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Student approved successfully",
      user
    });

  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;