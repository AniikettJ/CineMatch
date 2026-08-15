import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./TargetCursor.css";

export default function TargetCursor({
    targetSelector = ".cursor-target",
    spinDuration = 2,
    hideDefaultCursor = true,
    hoverDuration = 0.2,
    parallaxOn = true,
    cursorColor = "#ffffff",
}) {
    const cursorRef = useRef(null);

    useEffect(() => {
        const cursor = cursorRef.current;

        if (!cursor) return;

        const targets = document.querySelectorAll(targetSelector);

        if (hideDefaultCursor) {
            document.body.style.cursor = "none";
        }

        const corners = cursor.querySelectorAll(".target-corner");

        const rotate = gsap.to(cursor, {
            rotation: 360,
            duration: spinDuration,
            repeat: -1,
            ease: "none",
        });

        const moveCursor = (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.12,
                ease: "power2.out",
            });
        };

        const enterTarget = () => {
            gsap.to(cursor, {
                scale: 1.35,
                duration: hoverDuration,
                ease: "power2.out",
            });

            gsap.to(corners, {
                scale: 0.75,
                duration: hoverDuration,
                ease: "power2.out",
            });
        };

        const leaveTarget = () => {
            gsap.to(cursor, {
                scale: 1,
                duration: hoverDuration,
                ease: "power2.out",
            });

            gsap.to(corners, {
                scale: 1,
                duration: hoverDuration,
                ease: "power2.out",
            });
        };

        const parallax = (e) => {
            if (!parallaxOn) return;

            const rect = cursor.getBoundingClientRect();

            const x = (e.clientX - rect.left - rect.width / 2) * 0.08;
            const y = (e.clientY - rect.top - rect.height / 2) * 0.08;

            gsap.to(corners, {
                x,
                y,
                duration: 0.2,
                ease: "power2.out",
            });
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mousemove", parallax);

        targets.forEach((target) => {
            target.addEventListener("mouseenter", enterTarget);
            target.addEventListener("mouseleave", leaveTarget);
        });

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousemove", parallax);

            targets.forEach((target) => {
                target.removeEventListener("mouseenter", enterTarget);
                target.removeEventListener("mouseleave", leaveTarget);
            });

            rotate.kill();

            if (hideDefaultCursor) {
                document.body.style.cursor = "";
            }
        };
    }, [
        targetSelector,
        spinDuration,
        hideDefaultCursor,
        hoverDuration,
        parallaxOn,
    ]);

    return (
        <div
            ref={cursorRef}
            className="target-cursor"
            style={{ "--cursor-color": cursorColor }}
        >
            <span className="target-corner top-left target-corner"></span>
            <span className="target-corner top-right"></span>
            <span className="target-corner bottom-left"></span>
            <span className="target-corner bottom-right"></span>
            <span className="target-dot"></span>
        </div>
    );
}