import express from 'express';

const router = express.Router();

// GET /api/health - Verify that the Express server is running properly
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    project: 'College Student Management System',
    step: 'Step 1: Project Setup & Folder Structure',
    status: 'Server is running properly',
    timestamp: new Date().toISOString(),
  });
});

export default router;
