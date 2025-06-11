import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { createPathValidator } from './path-validation';

describe('PathValidator', () => {
  const testCdnDirectory = path.resolve('./test-cdn');
  let pathValidator: ReturnType<typeof createPathValidator>;

  beforeEach(async () => {
    // Ensure test CDN directory exists
    await fs.mkdir(testCdnDirectory, { recursive: true });
    
    // Create some test files
    await fs.writeFile(path.join(testCdnDirectory, 'valid-file.txt'), 'Test content');
    
    pathValidator = createPathValidator(testCdnDirectory);
  });

  it('should allow valid file paths within the CDN directory', async () => {
    const validPath = await pathValidator.validatePath('valid-file.txt');
    expect(validPath).toBe(path.resolve(testCdnDirectory, 'valid-file.txt'));
  });

  it('should prevent directory traversal attacks', async () => {
    await expect(pathValidator.validatePath('../etc/passwd')).rejects.toThrow('Access to the requested file is not allowed');
    await expect(pathValidator.validatePath('../../sensitive-file')).rejects.toThrow('Access to the requested file is not allowed');
  });

  it('should reject non-existent files', async () => {
    await expect(pathValidator.validatePath('non-existent.txt')).rejects.toThrow('File not found or not readable');
  });

  it('middleware should handle file path validation', async () => {
    const mockReq: any = { params: { 0: 'valid-file.txt' } };
    const mockRes: any = { 
      status: (code: number) => ({
        json: (obj: any) => ({ status: code, body: obj })
      }) 
    };
    const mockNext = () => {};

    const middleware = pathValidator.createMiddleware();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockReq.validatedFilePath).toBe(path.resolve(testCdnDirectory, 'valid-file.txt'));
  });
});