import type { NextApiRequest, NextApiResponse } from 'next';
import { BlobServiceClient } from '@azure/storage-blob';

// Blobストレージ接続設定
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
const containerClient = blobServiceClient.getContainerClient('threads'); // コンテナ名

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
            // Blobを取得
            const blobClient = containerClient.getBlockBlobClient(`${threadId}.json`);
            const exists = await blobClient.exists();

            if (!exists) {
                console.error(`[ERROR] Thread file not found: ${threadId}.json`);
                return res.status(404).json({
                    message: 'Thread Not Found',
                    threadId,
                });
            }

            // Blobの内容を取得
            const downloadResponse = await blobClient.download();
            const threadData = await streamToString(downloadResponse.readableStreamBody!);
            const thread = JSON.parse(threadData);

            // 新しい投稿を作成してスレッドに追加
            const newPost = {
                id,
                name: name || '名無しさん',
                content,
                timestamp,
            };
            thread.posts.push(newPost);

            // 更新されたデータをBlobに保存
            const updatedData = JSON.stringify(thread, null, 2);

            // 最新SDKに対応するデータアップロード処理
            await blobClient.uploadData(Buffer.from(updatedData), {
                blobHTTPHeaders: { blobContentType: 'application/json' },
                overwrite: true,
            });

            console.log(`[DEBUG] New post added to thread ${threadId}:`, newPost);
            return res.status(201).json({
                message: 'Post Created',
                post: newPost,
            });
        } catch (error) {
            console.error(`[ERROR] Failed to process request:`, error);
            return res.status(500).json({
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    } else {
        console.error(`[ERROR] Method Not Allowed: ${req.method}`);
        return res.status(405).json({
            message: 'Method Not Allowed',
            allowedMethods: ['POST'],
        });
    }
}

// StreamをStringに変換するユーティリティ関数
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on('data', (data) => {
            chunks.push(Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'));
        });
        readableStream.on('error', reject);
    });
}
