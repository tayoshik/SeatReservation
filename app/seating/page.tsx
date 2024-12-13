"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 座席表を生成する関数
const generateSeats = (rows: number, cols: number, prefix: string) => {
    const seats = [];
    for (let row = 0; row < rows; row++) {
        const rowSeats = [];
        for (let col = 1; col <= cols; col++) {
            rowSeats.push({
                number: `${prefix}${row + 1}-${col}`,
                displayName: `j ${row + 1}-${col}`,
            });
        }
        seats.push(rowSeats);
    }
    return seats;
};

// 座席配置データ
const seats = {
    hina: generateSeats(19, 19, "A"), // 3行 x 3列
};

type SeatStatus = {
    seat: string; // シート番号 (例: "A1-1")
    status: "available" | "reserved" | "occupied";
};

export default function SeatingPage() {
    const router = useRouter();
    const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>([]);

    // JSONデータをフェッチ
    useEffect(() => {
        const fetchSeatStatuses = async () => {
            try {
                const response = await fetch("/data/seats.json");
                const data = await response.json();
                if (data && Array.isArray(data.seats)) {
                    setSeatStatuses(data.seats);
                }
            } catch (error) {
                console.error("Failed to fetch seat statuses:", error);
            }
        };
        fetchSeatStatuses();
    }, []);

    // クリックハンドラ
    const handleSeatClick = (seat: string, status: string) => {
        if (status !== "occupied") {
            router.push(`/forum?seat=${seat}`);
        }
    };

    // 座席のスタイルを動的に設定
    const getSeatStyle = (seat: string) => {
        const seatStatus = seatStatuses.find((s) => s.seat === seat);
        if (seatStatus) {
            switch (seatStatus.status) {
                case "reserved":
                    return "bg-yellow-500 text-black border border-black"; // 予約済み
                case "occupied":
                    return "bg-black text-black border border-black cursor-not-allowed"; // 使用中（無反応）
                default:
                    return "bg-green-500 text-white border border-gray-300"; // 空席
            }
        }
        return "bg-gray-200 text-black border border-gray-300"; // データがない場合
    };

    const renderSeats = (seatGroup: any[][]) => {
        return seatGroup.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center my-0">
                {row.map((seat) => {
                    const seatStatus = seatStatuses.find((s) => s.seat === seat.number);
                    const status = seatStatus?.status || "available";
                    return (
                        <div
                            key={seat.number}
                            onClick={() => handleSeatClick(seat.number, status)}
                            className={`w-10 h-10 border m-0.5 flex items-center justify-center cursor-pointer ${getSeatStyle(seat.number)}`}
                            style={{
                                pointerEvents: status === "occupied" ? "none" : "auto",
                            }}
                        >
                            {seat.displayName}
                        </div>
                    );
                })}
            </div>
        ));
    };

    return (
        <div className="p-4 flex justify-center items-center flex-col">
            <h1 className="text-2xl font-bold text-center mb-8">座席表</h1>
            <div className="w-full overflow-auto">
                {renderSeats(seats.hina)}
            </div>
        </div>
    );
}
