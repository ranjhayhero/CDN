import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

/**
 * Route to retrieve a file from the CDN directory
 * @param {string} filename - Name of the file to retrieve
 * @returns {Object} File response or error
 */
router.get('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Explicit prevention of directory traversal and malicious paths
        const unsafePathChars = ['..', '/', '\\'];
        const hasDangerousPath = unsafePathChars.some(char => filename.includes(char));
        
        if (hasDangerousPath) {
            return res.status(403).json({ 
                error: 'Access denied', 
                message: 'Invalid file path' 
            });
        }

        // Define the CDN directory path
        const cdnDirectory = path.join(process.cwd(), 'cdn');

        // Sanitize filename
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(cdnDirectory, sanitizedFilename);

        // Ensure the requested file is within the CDN directory
        const resolvedCdnPath = path.resolve(cdnDirectory);
        const resolvedFilePath = path.resolve(filePath);

        if (!resolvedFilePath.startsWith(resolvedCdnPath)) {
            return res.status(403).json({ 
                error: 'Access denied', 
                message: 'Invalid file path' 
            });
        }

        // Check if file exists
        await fs.access(filePath);

        // Read the file content
        const fileContent = await fs.readFile(filePath, 'utf-8');

        res.status(200).send(fileContent);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // For traversal-like attempts, return 403
            const { filename } = req.params;
            if (filename.includes('..') || filename.startsWith('/')) {
                return res.status(403).json({ 
                    error: 'Access denied', 
                    message: 'Invalid file path' 
                });
            }

            // Otherwise, return 404
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'File not found in CDN' 
            });
        }

        console.error('File retrieval error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Could not retrieve file' 
        });
    }
});

export default router;