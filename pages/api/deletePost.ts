import type { NextApiRequest, NextApiResponse } from 'next';
import { BlobServiceClient } from '@azure/storage-blob';

// Blobストレージ接続設定
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
const containerClient = blobServiceClient.getContainerClient('threads');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(`[DEBUG] Request method: ${req.method}`);
    console.log(`[DEBUG] Request body:`, req.body);

    if (req.method === 'DELETE') {
        const { threadId, postId } = req.body;

        // バリデーション: 必須項目の確認
        if (!threadId || !postId) {
            console.error(`[ERROR] Invalid request body:`, req.body);
            return res.status(400).json({
                message: 'Invalid Request',
                details: 'threadId and postId are required.',
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

            // 投稿を検索して削除
            const postIndex = thread.posts.findIndex((post: any) => post.id === postId);

            if (postIndex === -1) {
                console.error(`[ERROR] Post not found: ${postId}`);
                return res.status(404).json({
                    message: 'Post Not Found',
                    threadId,
                    postId,
                });
            }

            // 投稿を配列から削除
            const deletedPost = thread.posts.splice(postIndex, 1)[0];

            // 更新されたデータをBlobに保存
            const updatedData = JSON.stringify(thread, null, 2);

            await blobClient.upload(Buffer.from(updatedData), updatedData.length, {
                blobHTTPHeaders: { blobContentType: 'application/json' }
            });

            console.log(`[DEBUG] Post deleted from thread ${threadId}:`, deletedPost);
            return res.status(200).json({
                message: 'Post Deleted',
                deletedPost,
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