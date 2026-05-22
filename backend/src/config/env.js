/**
 * Environment variable validation and configuration.
 * Loads .env file and exports validated config object.
 */
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 500,
};

// Validate required variables
const requiredVars = ['mongodbUri', 'jwtSecret'];
for (const varName of requiredVars) {
  if (!config[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    console.error('   Please check your .env file against .env.example');
    process.exit(1);
  }
}

module.exports = config;
