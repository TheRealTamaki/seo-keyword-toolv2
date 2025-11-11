import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/rankings/:keywordId
router.get('/:keywordId', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/rankings/check
router.post('/check', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
