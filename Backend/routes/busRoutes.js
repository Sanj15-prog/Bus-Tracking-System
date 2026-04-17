const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');

// Get all buses
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update bus location
router.put('/:id/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { latitude, longitude },
        lastUpdated: Date.now()
      },
      { new: true }
    );

    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    res.json(bus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ CREATE NEW BUS WITH SOURCE/DESTINATION
router.post('/', async (req, res) => {
  try {
    const { busNumber, route, source, destination } = req.body;
    const bus = new Bus({
      busNumber,
      route,
      source: source || 'Unknown Source',
      destination: destination || 'Unknown Destination',
      currentLocation: { latitude: 15.3344, longitude: 74.7570 } // Default creation center
    });
    
    await bus.save();
    res.status(201).json(bus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;