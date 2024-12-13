import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { id, title, timestamp } = req.body;

        if (!id || !title || !timestamp) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        try {
            console.log('Sending request to Azure Functions saveThread...');

            const functionUrl = 'https://nextjs-functions-appllkmnjc35s.azurewebsites.net/api/saveThread';
            console.log('Request URL:', functionUrl);
            console.log('Request body:', JSON.stringify(req.body));

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    title,
                    timestamp,
                    posts: []
                }),
            });

            console.log('Azure Function Status:', response.status);
            console.log('Azure Function Headers:', Object.fromEntries(response.headers));

            const responseText = await response.text();
            console.log('Azure Function Response:', responseText);

            if (!response.ok) {
                // レスポンスの詳細情報を含めてエラーをスロー
                throw new Error(`Azure Functions returned ${response.status}: ${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                throw new Error('Invalid JSON response from Azure Functions');
            }

            return res.status(201).json({
                message: "Thread created successfully",
                threadId: id,
                details: data
            });
        } catch (error) {
            console.error('Error in saveThread API:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            return res.status(500).json({
                error: 'Internal Server Error',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}