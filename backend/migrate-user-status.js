/**
 * migrate-user-status.js
 * ──────────────────────
 * One-time migration script.
 * Sets status: 'approved' on all existing users who have no status field,
 * so they are not locked out after the new approval-gated login is deployed.
 *
 * Usage:
 *   node backend/migrate-user-status.js
 */
require('./src/config/env'); // Load env vars
const mongoose = require('mongoose');
const User = require('./src/models/User');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all users that have no status field (null/undefined) → set to 'approved'
    const result = await User.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'approved' } }
    );

    console.log(`✅ Migration complete. Updated ${result.modifiedCount} user(s) to status: 'approved'.`);
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

migrate();
