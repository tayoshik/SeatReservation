import type { NextApiRequest, NextApiResponse } from 'next';
import { BlobServiceClient } from '@azure/storage-blob';

// Blobストレージ接続設定
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
const containerClient = blobServiceClient.getContainerClient('threads');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(`[DEBUG] Request method: ${req.method}`);
    console.log(`[DEBUG] Request body:`, req.body);

    if (req.method === 'DELETE') {
        const { threadId } = req.body;

        // バリデーション: 必須項目の確認
        if (!threadId) {
            console.error(`[ERROR] Invalid request body:`, req.body);
            return res.status(400).json({
                message: 'Invalid Request',
                details: 'threadId is required.',
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

            // スレッドの内容を取得（削除前の確認とログ用）
            const downloadResponse = await blobClient.download();
            const threadData = await streamToString(downloadResponse.readableStreamBody!);
            const thread = JSON.parse(threadData);

            // Blobを削除
            await blobClient.delete();

            console.log(`[DEBUG] Thread deleted: ${threadId}`, thread);
            return res.status(200).json({
                message: 'Thread Deleted',
                deletedThread: thread,
            });

        } catch (error: any) {
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
            allowedMethods: ['DELETE'],
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