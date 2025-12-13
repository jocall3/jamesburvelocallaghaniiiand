import type { NextApiRequest, NextApiResponse } from 'next';

const CENTRAL_API_URL = process.env.CENTRAL_API_URL || 'http://localhost:3000/api/central/subscribe'; // Fallback to localhost if not defined

type Data = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    try {
      // Forward the request to the central API
      const response = await fetch(CENTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body), // Forward the original request body
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ error: errorData.message || 'Failed to subscribe via central API' });
      }

      const data = await response.json();
      res.status(200).json({ success: true, message: data.message || 'Subscription request forwarded successfully' });

    } catch (error: any) {
      console.error('Error forwarding subscription request:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}