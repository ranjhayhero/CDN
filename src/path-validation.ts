import path from 'path';
import fs from 'fs/promises';

/**
 * Security middleware to validate file paths
 * Prevents directory traversal and ensures files are within the allowed CDN directory
 */
export class PathValidator {
  private cdnDirectory: string;

  constructor(cdnDirectory: string) {
    this.cdnDirectory = path.resolve(cdnDirectory);
  }

  /**
   * Validates and resolves a file path within the CDN directory
   * @param requestedPath - The path requested by the client
   * @throws {Error} If the path is invalid or outside the CDN directory
   * @returns Resolved absolute path to the file
   */
  async validatePath(requestedPath: string): Promise<string> {
    // Normalize and resolve the requested path
    const normalizedRequestedPath = path.normalize(requestedPath);
    const resolvedPath = path.resolve(this.cdnDirectory, normalizedRequestedPath);

    // Check if the resolved path is within the CDN directory
    const isWithinCdnDirectory = resolvedPath.startsWith(this.cdnDirectory);
    if (!isWithinCdnDirectory) {
      throw new Error('Access to the requested file is not allowed');
    }

    // Check if the file exists and is readable
    try {
      await fs.access(resolvedPath, fs.constants.R_OK);
    } catch (error) {
      throw new Error('File not found or not readable');
    }

    return resolvedPath;
  }

  /**
   * Middleware for Express to validate file paths
   */
  createMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const filePath = req.params[0] || req.query.path;
        if (!filePath) {
          return res.status(400).json({ error: 'No file path provided' });
        }

        req.validatedFilePath = await this.validatePath(filePath);
        next();
      } catch (error) {
        // Generic error response to prevent information leakage
        res.status(403).json({ error: 'File access denied' });
      }
    };
  }
}

// Export a factory function for easier instantiation
export const createPathValidator = (cdnDirectory: string) => {
  return new PathValidator(cdnDirectory);
};