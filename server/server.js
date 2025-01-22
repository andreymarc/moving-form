import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const __dirname = path.resolve();

dotenv.config(); // Load environment variables from .env

// Validate environment variables
if (!process.env.CAMPAIGN_ID || !process.env.CAMPAIGN_KEY || !process.env.API_URL) {
  throw new Error('Missing required environment variables: CAMPAIGN_ID, CAMPAIGN_KEY, or API_URL');
}

const app = express();
const PORT = process.env.PORT || 3000;
const campaignId = process.env.CAMPAIGN_ID;
const campaignKey = process.env.CAMPAIGN_KEY;
const apiUrl = process.env.API_URL;

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/proxy', limiter);

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Validation Middleware for /proxy endpoint
const validateRequest = [
  body('zip_code').isPostalCode('US').withMessage('Invalid ZIP code.'),
  body('move_to_zip_code').isPostalCode('US').withMessage('Invalid Move To ZIP code.'),
  body('move_to_state').notEmpty().withMessage('Move to state is required.'),
  body('move_date').isISO8601().toDate().withMessage('Invalid move date.'),
  body('moving_size').notEmpty().withMessage('Moving size is required.'),
];

// Proxy Endpoint
app.post('/proxy', validateRequest, async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Extracting request data
    const {
      zip_code,
      move_to_zip_code,
      move_to_state,
      move_date,
      moving_size,
      long_distance_custom,
    } = req.body;

    // Construct the payload for the API
    const payload = {
      auth: {
        lp_campaign_id: campaignId,
        lp_campaign_key: campaignKey,
      },
      mode: {
        lp_test: false, // Set to false for production
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

    // Return the API response to the client
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Failed to fetch movers', message: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
