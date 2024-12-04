"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Thread {
    id: number;
    title: string;
    posts: { id: number; name: string; message: string }[];
}

export default function ForumPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const seat = searchParams.get("seat") || "";
    const focusNewPost = searchParams.get("focus") === "newPost";

    const [threads, setThreads] = useState<Thread[]>([]);
    const [newThread, setNewThread] = useState({ title: seat });
    const [newPost, setNewPost] = useState({ threadId: 0, name: "", message: "" });

    const newPostInputRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (focusNewPost && newPostInputRef.current) {
            newPostInputRef.current.focus();
        }
    }, [focusNewPost]);

    const handleThreadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newThread.title.trim() === "") return;

        const newId = threads.length + 1;
        setThreads([...threads, { id: newId, title: newThread.title, posts: [] }]);
        setNewThread({ title: "" });
    };

    const handlePostSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPost.message.trim() === "" || newPost.threadId === 0) return;

        setThreads((prevThreads) =>
            prevThreads.map((thread) =>
                thread.id === newPost.threadId
                    ? {
                        ...thread,
                        posts: [
                            ...thread.posts,
                            {
                                id: thread.posts.length + 1,
                                name: newPost.name || "名無しさん",
                                message: newPost.message,
                            },
                        ],
                    }
                    : thread
            )
        );
        setNewPost({ threadId: 0, name: "", message: "" });
    };

    const deleteThread = (threadId: number) => {
        setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
    };

    const deletePost = (threadId: number, postId: number) => {
        setThreads((prevThreads) =>
            prevThreads.map((thread) =>
                thread.id === threadId
                    ? { ...thread, posts: thread.posts.filter((post) => post.id !== postId) }
                    : thread
            )
        );
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
                <h2 className="text-lg font-semibold mb-2">スレッドを作成する</h2>
                <form onSubmit={handleThreadSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">スレッドタイトル</label>
                        <input
                            type="text"
                            value={newThread.title}
                            onChange={(e) => setNewThread({ title: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="スレッドのタイトルを入力"
                        />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                        スレッドを作成
                    </button>
                </form>
            </div>

            {threads.map((thread) => (
                <div key={thread.id} className="mb-6 border border-gray-300 p-4 rounded bg-gray-50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">{thread.title}</h2>
                        <button
                            onClick={() => deleteThread(thread.id)}
                            className="text-red-500 hover:underline"
                        >
                            スレッドを削除
                        </button>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setNewPost((prev) => ({ ...prev, threadId: thread.id }));
                            handlePostSubmit(e);
                        }}
                        className="space-y-4 mt-4"
                    >
                        <div>
                            <label className="block text-sm font-medium mb-1">名前</label>
                            <input
                                type="text"
                                value={newPost.threadId === thread.id ? newPost.name : ""}
                                onChange={(e) =>
                                    setNewPost((prev) => ({
                                        ...prev,
                                        threadId: thread.id,
                                        name: e.target.value,
                                    }))
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="名無しさん"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">メッセージ</label>
                            <textarea
                                ref={thread.id === newPost.threadId ? newPostInputRef : null}
                                value={newPost.threadId === thread.id ? newPost.message : ""}
                                onChange={(e) =>
                                    setNewPost((prev) => ({
                                        ...prev,
                                        threadId: thread.id,
                                        message: e.target.value,
                                    }))
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                rows={4}
                                placeholder="メッセージを入力"
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                            投稿する
                        </button>
                    </form>
                    <div className="mt-4 space-y-4">
                        <h3 className="text-md font-semibold">投稿一覧</h3>
                        {thread.posts.map((post) => (
                            <div
                                key={post.id}
                                className="border border-gray-300 p-4 rounded bg-white flex justify-between items-start"
                            >
                                <div>
                                    <p className="text-sm text-gray-500">
                                        No.{post.id} 名前: {post.name}
                                    </p>
                                    <p className="mt-2 text-gray-800">{post.message}</p>
                                </div>
                                <button
                                    onClick={() => deletePost(thread.id, post.id)}
                                    className="text-red-500 hover:underline"
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
