import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { id, title, timestamp } = req.body;

        if (!id || !title || !timestamp) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        try {
            // Azure Functions にリクエストを転送
            const response = await fetch('http://localhost:7071/api/SaveThreadFunction', {
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

            if (!response.ok) {
                throw new Error(`Azure Functions returned ${response.status}`);
            }

            const data = await response.json();
            return res.status(201).json({ message: "Thread created successfully", threadId: id });
        } catch (error) {
            console.error('Error in saveThread API:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}