import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/api-keys/:userId
router.get('/:userId', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/api-keys
router.post('/', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// PUT /api/api-keys/:id
router.put('/:id', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/api-keys/:id
router.delete('/:id', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/api-keys/:id/validate
router.post('/:id/validate', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
