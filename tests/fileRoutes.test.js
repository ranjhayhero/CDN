import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import fileRoutes from '../src/routes/fileRoutes';

describe('File Retrieval Routes', () => {
    const app = express();
    app.use(fileRoutes);

    it('should successfully retrieve an existing file', async () => {
        const response = await request(app).get('/files/test.txt');
        
        expect(response.status).toBe(200);
        expect(response.text.trim()).toBe('This is a test file for CDN retrieval.');
    });

    it('should return 404 for non-existent file', async () => {
        const response = await request(app).get('/files/nonexistent.txt');
        
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Not Found');
    });

    it('should prevent directory traversal attempts', async () => {
        const response = await request(app).get('/files/../secret.txt');
        
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied');
    });
});