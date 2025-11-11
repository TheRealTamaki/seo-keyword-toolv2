import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/keywords/:projectId
router.get('/:projectId', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/keywords
router.post('/', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/keywords/:id
router.delete('/:id', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
