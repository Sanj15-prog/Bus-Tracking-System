const mongoose = require('mongoose');
const Bus = require('./models/Bus');
require('dotenv').config();

const updateData = [
  { busNumber: 'B101', source: 'Haliyal', destination: 'Belgaum', route: 'Haliyal -> Belgaum' },
  { busNumber: 'B102', source: 'Haliyal', destination: 'Dandeli', route: 'Haliyal -> Dandeli' },
  { busNumber: 'B103', source: 'Haliyal', destination: 'Hubli', route: 'Haliyal -> Dharwad -> Hubli' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    for (const data of updateData) {
      const result = await Bus.findOneAndUpdate(
        { busNumber: data.busNumber },
        { 
          source: data.source,
          destination: data.destination,
          // Since the schema has 'route' as required, ensure it exists just in case
          route: data.route
        },
        { new: true, upsert: true } // If they accidentally deleted their buses, this ensures they are recreated natively!
      );
      console.log(`Updated Bus ${data.busNumber}: ${result.source} -> ${result.destination}`);
    }
    
    console.log('Database update fully complete.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

run();
