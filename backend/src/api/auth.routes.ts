import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
