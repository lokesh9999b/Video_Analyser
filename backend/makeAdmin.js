require('./src/config/env'); // Load env vars
const mongoose = require('mongoose');
const User = require('./src/models/User');

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const result = await User.updateMany(
      { email: 'lokeshbommagani99@gmail.com' },
      { $set: { role: 'admin' } }
    );
    
    console.log(`Updated ${result.modifiedCount} user(s) to admin.`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

makeAdmin();
