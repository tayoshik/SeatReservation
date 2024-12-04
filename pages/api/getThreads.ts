import type { NextApiRequest, NextApiResponse } from "next";

let threads = []; // 一時的なメモリ内ストレージ

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        res.status(200).json({ threads });
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
