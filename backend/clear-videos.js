require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('./src/models/Video'); // Adjust path if needed

async function clearVideos() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected! Deleting all video records...');
    const result = await Video.deleteMany({});
    
    console.log(`Successfully deleted ${result.deletedCount} videos from the database.`);
    process.exit(0);
  } catch (error) {
    console.error('Error clearing videos:', error);
    process.exit(1);
  }
}

clearVideos();
