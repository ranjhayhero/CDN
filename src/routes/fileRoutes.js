const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

/**
 * Route to retrieve a file from the CDN directory
 * @param {string} filename - Name of the file to retrieve
 * @returns {Object} File response or error
 */
router.get('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Define the CDN directory path (configurable in a real-world scenario)
        const cdnDirectory = path.join(process.cwd(), 'cdn');

        // Validate filename (prevent directory traversal)
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

        // Get file stats
        const stats = await fs.stat(filePath);

        // Stream the file
        res.sendFile(filePath, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': stats.size
            }
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
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

module.exports = router;