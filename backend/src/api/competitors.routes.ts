import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/competitors/:projectId
router.get('/:projectId', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/competitors
router.post('/', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/competitors/:id
router.delete('/:id', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
