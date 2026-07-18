import { useEffect, useState } from "react";

// Minimal branding watermark — "Umang Vision Academy" only, no student
// identity, no timestamp. Very sparse (3-4 instances) so it stays subtle.
export default function WatermarkOverlay({ user, dense = false }) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 8000);
        return () => clearInterval(interval);
    }, []);

    if (!user) return null;

    const spacing = dense ? 420 : 520;
    const rotation = -22 + (tick % 5);

    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 40,
                pointerEvents: "none",
                overflow: "hidden",
                userSelect: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: "-20%",
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fill, ${spacing}px)`,
                    gap: `${spacing * 0.6}px`,
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 1.5s ease",
                }}
            >
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.14)",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.04em",
                            textShadow: "0 1px 1px rgba(0,0,0,0.4)",
                        }}
                    >
                        Umang Vision Academy
                    </div>
                ))}
            </div>
        </div>
    );
}