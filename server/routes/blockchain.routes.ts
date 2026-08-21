import { Router, Request, Response } from 'express';
import { verifyHashOnBlockchain } from '../services/blockchain.js';

const router = Router();

// Public endpoint to verify SHA-256 hash on blockchain (no authentication required)
router.get('/verify/:hash', async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    if (!hash) {
      return res.status(400).json({ error: 'SHA-256 hash parameter is required' });
    }
    const result = await verifyHashOnBlockchain(hash);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /verify/:hash:', error);
    res.status(500).json({ error: error.message || 'Failed to verify hash on blockchain' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { hash } = req.body;
    if (!hash) {
      return res.status(400).json({ error: 'SHA-256 hash is required in body' });
    }
    const result = await verifyHashOnBlockchain(hash);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /verify:', error);
    res.status(500).json({ error: error.message || 'Failed to verify hash on blockchain' });
  }
});

export default router;
