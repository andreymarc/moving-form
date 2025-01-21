import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
const __dirname = path.resolve();



dotenv.config(); // Load environment variables from .env

const app = express();
const PORT = 3000;
const campaignId = process.env.CAMPAIGN_ID;
const campaignKey = process.env.CAMPAIGN_KEY;
const apiUrl = process.env.API_URL;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy Endpoint
app.post('/proxy', async (req, res) => {
  try {
    // Extracting request data from the embedded script
    const {
      zip_code,
      move_to_zip_code,
      move_to_state,
      move_date,
      moving_size,
      long_distance_custom,
    } = req.body;

    // Validate required fields
    if (!zip_code || !move_to_zip_code || !move_to_state || !move_date || !moving_size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Construct the payload for the API
    const payload = {
      auth: {
        lp_campaign_id: campaignId,
        lp_campaign_key: campaignKey,
      },
      mode: {
        lp_test: true, // Set to false for production
      },
      lead: {
        zip_code,
        move_date,
        move_to_state,
        move_to_zip_code,
        moving_size,
        long_distance_custom: long_distance_custom ?? false,
      },
    };

    console.log('Payload Sent to API:', JSON.stringify(payload, null, 2));

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check API response status
    if (!response.ok) {
      console.error(`API Error: ${response.statusText}`);
      return res.status(502).json({ error: 'API request failed', details: response.statusText });
    }

    const data = await response.json();
    console.log('API Response:', data);

    // Return the API response to the client (embedded script)
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Failed to fetch movers', message: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));


// Start Server
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
