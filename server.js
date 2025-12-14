import express from 'express';
import cors from 'cors';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Google Analytics client setup
const client = new BetaAnalyticsDataClient({
  keyFile: process.env.GOOGLE_SERVICE_KEY_JSON, // path to service-account.json
});

// Realtime visitors endpoint
app.get('/api/realtime-visitors', async (req, res) => {
  try {
    const [response] = await client.runRealtimeReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`, // GA4 property ID
      metrics: [{ name: 'activeUsers' }],
    });

    const liveVisitors = response.rows?.[0]?.metricValues?.[0]?.value || 0;
    res.json({ count: Number(liveVisitors) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ count: 0, error: 'Failed to fetch real-time visitors' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
