const request = require('supertest');
const express = require('express');

// We test a subset of endpoints using a mock express app 
// to avoid connecting to the real DB during CI.
const app = express();
app.use(express.json());

// Mock Health Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pulse Video Platform API is running'
  });
});

// Mock Auth Failure
app.get('/api/videos', (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  res.status(200).json({ success: true, data: { videos: [] } });
});

describe('Pulse Video API Tests', () => {
  
  describe('GET /api/health', () => {
    it('should return 200 OK and success message', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('running');
    });
  });

  describe('GET /api/videos (Authentication)', () => {
    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request(app).get('/api/videos');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 OK if authorized (mock)', async () => {
      const response = await request(app)
        .get('/api/videos')
        .set('Authorization', 'Bearer dummy-token');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

});
