import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 環境変数から Azure Function の URL を取得
    const functionUrl = process.env.AZURE_FUNCTION_URL;

    if (!functionUrl) {
        console.error("環境変数 AZURE_FUNCTION_URL が設定されていません。");
        return res.status(500).json({
            error: "サーバー構成エラー",
            details: "環境変数 AZURE_FUNCTION_URL が設定されていません。",
        });
    }

    if (req.method === "GET") {
        try {
            console.log("Azure Function getThreads を呼び出し中...");
            console.log("呼び出し先URL:", functionUrl);

            const response = await fetch(functionUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            });

            console.log("Azure Function ステータス:", response.status);
            console.log("Azure Function ヘッダー:", JSON.stringify([...response.headers]));

            // レスポンスが成功でない場合はエラー
            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`Azure Functions エラー ${response.status}: ${responseText}`);
            }

            // JSONレスポンスを取得
            const data = await response.json();
            return res.status(200).json(data);

        } catch (error) {
            console.error("getThreads API の詳細エラー:", error);
            return res.status(500).json({
                error: "サーバーエラー",
                details: error instanceof Error ? error.message : "不明なエラー",
                timestamp: new Date().toISOString(),
            });
        }
    } else {
        // 他のHTTPメソッドには405エラーを返す
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} は許可されていません`);
    }
}
