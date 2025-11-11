import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/projects
router.get('/', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/projects
router.post('/', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/projects/:id
router.get('/:id', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// PUT /api/projects/:id
router.put('/:id', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/projects/:id
router.delete('/:id', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
