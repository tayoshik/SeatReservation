import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(`[DEBUG] Request method: ${req.method}`);
    console.log(`[DEBUG] Request body:`, req.body);

    if (req.method === 'POST') {
        const { id, threadId, name, content, timestamp } = req.body;

        // バリデーション: 必須項目が存在するか確認
        if (!id || !threadId || !content || !timestamp) {
            console.error(`[ERROR] Invalid request body:`, req.body);
            return res.status(400).json({
                message: 'Invalid Request',
                details: 'id, threadId, content, and timestamp are required.',
            });
        }

        try {
            // Azure Functions にリクエストを転送
            const response = await fetch('https://nextjs-functions-appllkmnjc35s.azurewebsites.net/api/savePost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    threadId,
                    name: name || '名無しさん',
                    content,
                    timestamp
                }),
            });

            if (!response.ok) {
                throw new Error(`Azure Functions returned ${response.status}`);
            }

            const data = await response.json();
            return res.status(201).json({
                message: 'Post Created',
                post: {
                    id,
                    name: name || '名無しさん',
                    content,
                    timestamp
                }
            });

        } catch (error) {
            console.error('[ERROR] Failed to process request:', error);
            return res.status(500).json({
                message: 'Internal Server Error',
                error: error.message
            });
        }
    } else {
        console.error(`[ERROR] Method Not Allowed: ${req.method}`);
        return res.status(405).json({
            message: 'Method Not Allowed',
            allowedMethods: ['POST']
        });
    }
}