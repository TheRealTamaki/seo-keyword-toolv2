import { Request, Response, NextFunction } from 'express';
import * as ProjectModel from '../models/project.model';

// Extend Express Request to include project
declare global {
  namespace Express {
    interface Request {
      project?: ProjectModel.Project;
      projectId?: string;
    }
  }
}

/**
 * Middleware to verify user owns the project
 * Extracts projectId from params and checks ownership
 * Should be used after authenticate middleware
 */
export async function verifyProjectOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const projectId = req.params.id || req.params.projectId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!projectId) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
      return;
    }

    const project = await ProjectModel.findProjectByIdAndUserId(projectId, userId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found or access denied',
      });
      return;
    }

    // Attach project to request for use in route handlers
    req.project = project;
    req.projectId = projectId;

    next();
  } catch (error) {
    console.error('Project ownership verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify project ownership',
    });
  }
}

/**
 * Middleware to check if project exists (doesn't verify ownership)
 * Useful for read-only operations
 */
export async function checkProjectExists(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = req.params.id || req.params.projectId;

    if (!projectId) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
      return;
    }

    const project = await ProjectModel.findProjectById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    req.project = project;
    req.projectId = projectId;

    next();
  } catch (error) {
    console.error('Project existence check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check project existence',
    });
  }
}
