"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface Thread {
    id: string;
    title: string;
    timestamp: string;
    posts: {
        id: string;
        content: string;
        timestamp: string;
        name: string;
    }[];
}

export default function ForumPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const seat = searchParams.get("seat") || "";
    const focusNewPost = searchParams.get("focus") === "newPost";

    const [threads, setThreads] = useState<Thread[]>([]);
    const [newThread, setNewThread] = useState({ title: seat });
    const [postForms, setPostForms] = useState<{ [key: string]: { name: string; content: string } }>({});
    const [isLoading, setIsLoading] = useState(false);

    const newPostInputRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        fetchThreads();
    }, []);

    useEffect(() => {
        if (focusNewPost && newPostInputRef.current) {
            newPostInputRef.current.focus();
        }
    }, [focusNewPost]);

    const fetchThreads = async () => {
        try {
            const response = await fetch("/api/getThreads");
            if (!response.ok) throw new Error("スレッドの取得に失敗しました");
            const data = await response.json();
            if (Array.isArray(data.threads)) {
                setThreads(data.threads);
            } else {
                console.error("予期しないレスポンス形式:", data);
            }
        } catch (error) {
            console.error("エラー:", error);
        }
    };

    const handleThreadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newThread.title.trim() === "") return;
        setIsLoading(true);

        try {
            const newId = uuidv4();
            const response = await fetch("/api/saveThread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newId,
                    title: newThread.title,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) throw new Error("スレッドの作成に失敗しました");

            setThreads([
                ...threads,
                {
                    id: newId,
                    title: newThread.title,
                    timestamp: new Date().toISOString(),
                    posts: [],
                },
            ]);
            setNewThread({ title: "" });
        } catch (error) {
            console.error("エラー:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostSubmit = async (e: React.FormEvent, threadId: string) => {
        e.preventDefault();
        const currentForm = postForms[threadId] || { name: "", content: "" };
        if (currentForm.content.trim() === "") return;

        setIsLoading(true);

        try {
            const newId = uuidv4();
            const response = await fetch("/api/savePost", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newId,
                    threadId,
                    name: currentForm.name || "名無しさん",
                    content: currentForm.content,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error: ${response.status}`);
            }

            setThreads((prevThreads) =>
                prevThreads.map((thread) =>
                    thread.id === threadId
                        ? {
                            ...thread,
                            posts: [
                                ...thread.posts,
                                {
                                    id: newId,
                                    name: currentForm.name || "名無しさん",
                                    content: currentForm.content,
                                    timestamp: new Date().toISOString(),
                                },
                            ],
                        }
                        : thread
                )
            );

            setPostForms((prev) => ({
                ...prev,
                [threadId]: { name: "", content: "" },
            }));
        } catch (error) {
            console.error("Error posting:", error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteThread = async (threadId: string) => {
        if (!confirm("このスレッドを削除してもよろしいですか？")) return;

        try {
            const response = await fetch(`/api/deleteThread`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threadId }),
            });

            if (!response.ok) throw new Error("スレッドの削除に失敗しました");
            setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
        } catch (error) {
            console.error("エラー:", error);
        }
    };

    const deletePost = async (threadId: string, postId: string) => {
        if (!confirm("この投稿を削除してもよろしいですか？")) return;

        try {
            const response = await fetch(`/api/deletePost`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threadId, postId }),
            });

            if (!response.ok) throw new Error("投稿の削除に失敗しました");
            setThreads((prevThreads) =>
                prevThreads.map((thread) =>
                    thread.id === threadId
                        ? { ...thread, posts: thread.posts.filter((post) => post.id !== postId) }
                        : thread
                )
            );
        } catch (error) {
            console.error("エラー:", error);
        }
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">座席４８９ちゃんねる 連絡掲示板</h1>
            <button
                onClick={() => router.push("/seating")}
                className="bg-gray-500 text-white px-4 py-2 mb-6 rounded"
            >
                座席表に戻る
            </button>

            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">スレッドを作成する</h2>
                <form onSubmit={handleThreadSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                            スレッドタイトル
                        </label>
                        <input
                            type="text"
                            value={newThread.title}
                            onChange={(e) => setNewThread({ title: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="スレッドのタイトルを入力"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? "作成中..." : "スレッドを作成"}
                    </button>
                </form>
            </div>

            {threads.map((thread) => (
                <div key={thread.id} className="mb-6 border border-gray-300 p-4 rounded bg-gray-50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">{thread.title}</h2>
                        <button
                            onClick={() => deleteThread(thread.id)}
                            className="text-red-500 hover:underline disabled:opacity-50"
                            disabled={isLoading}
                        >
                            スレッドを削除
                        </button>
                    </div>
                    <form
                        onSubmit={(e) => handlePostSubmit(e, thread.id)}
                        className="space-y-4 mt-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                                名前
                            </label>
                            <input
                                type="text"
                                value={postForms[thread.id]?.name || ""}
                                onChange={(e) =>
                                    setPostForms((prev) => ({
                                        ...prev,
                                        [thread.id]: {
                                            ...prev[thread.id],
                                            name: e.target.value,
                                        },
                                    }))
                                }
                                className="w-full p-2 border border-gray-300 rounded text-gray-900"
                                placeholder="名無しさん"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                                メッセージ
                            </label>
                            <textarea
                                ref={focusNewPost ? newPostInputRef : null}
                                value={postForms[thread.id]?.content || ""}
                                onChange={(e) =>
                                    setPostForms((prev) => ({
                                        ...prev,
                                        [thread.id]: {
                                            ...prev[thread.id],
                                            content: e.target.value,
                                        },
                                    }))
                                }
                                className="w-full p-2 border border-gray-300 rounded text-gray-900"
                                rows={4}
                                placeholder="メッセージを入力"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? "投稿中..." : "投稿する"}
                        </button>
                    </form>
                    <div className="mt-4 space-y-4">
                        <h3 className="text-md font-semibold text-gray-900">投稿一覧</h3>
                        {thread.posts.map((post) => (
                            <div
                                key={post.id}
                                className="border border-gray-300 p-4 rounded bg-white flex justify-between items-start"
                            >
                                <div>
                                    <p className="text-sm text-gray-900">
                                        No.{post.id} 名前: {post.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(post.timestamp).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                                    </p>
                                    <p className="mt-2 text-gray-900">{post.content}</p>
                                </div>
                                <button
                                    onClick={() => deletePost(thread.id, post.id)}
                                    className="text-red-500 hover:underline disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    削除
                                </button>
                            </div>
                        ))}
                        {thread.posts.length === 0 && (
                            <p className="text-gray-500">まだ投稿はありません。</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
