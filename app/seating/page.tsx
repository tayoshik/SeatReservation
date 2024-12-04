"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const generateSeats = (rows: number, cols: number, prefix: string) => {
    const seats = [];
    for (let row = 0; row < rows; row++) {
        const rowSeats = [];
        for (let col = 1; col <= cols; col++) {
            rowSeats.push(`${prefix}${row + 1}-${col}`);
        }
        seats.push(rowSeats);
    }
    return seats;
};

const seats = {
    hina: generateSeats(40, 30, "A"),
};

export default function SeatingPage() {
    const router = useRouter();
    const [threadedSeats, setThreadedSeats] = useState<string[]>([]);

    const handleSeatClick = (seat: string) => {
        if (!threadedSeats.includes(seat)) {
            setThreadedSeats((prev) => [...prev, seat]);
            router.push(`/forum?seat=${seat}`);
        } else {
            router.push(`/forum?seat=${seat}&focus=newPost`);
        }
    };

    const renderSeats = (seatGroup: string[][]) => {
        return seatGroup.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center my-1">
                {row.map((seat) => (
                    <div
                        key={seat}
                        onClick={() => handleSeatClick(seat)}
                        className={`w-16 h-16 border m-0.5 flex items-center justify-center cursor-pointer ${threadedSeats.includes(seat)
                            ? "bg-[var(--color-secondary)] text-black"
                            : "bg-[var(--color-primary)] text-white"
                            }`}
                    >
                        {seat}
                    </div>
                ))}
            </div>
        ));
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-center mb-8">座席表</h1>
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">前方出入口</h2>
                {renderSeats(seats.hina)}
            </div>
        </div>
    );
}
