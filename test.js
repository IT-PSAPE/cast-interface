


(function () {
    const root = document.currentScript.closest("[data-infinite-carousel='track']");

    if (!root) return

    document.addEventListener('DOMContentLoaded', function () {
        function horizontalCarousel(listSelector, speed = 80) {
            const track = root
            const list = root.querySelector(listSelector);

            if (!track || !list) {
                console.warn("[carousel] missing elements — track:", track, "list:", list);
                return null;
            }

            const items = gsap.utils.toArray(list.children);
            if (!items.length) {
                console.warn("[carousel] no items found inside list");
                return null;
            }

            const viewportWidth = track.clientWidth;

            // Read the CSS gap from the list (flex/grid gap lost when switching to absolute)
            const listStyle = getComputedStyle(list);
            const gap = parseFloat(listStyle.columnGap) || parseFloat(listStyle.gap) || 0;

            // Measure each item including horizontal margins
            const measurements = items.map((el) => {
                const style = getComputedStyle(el);
                const marginL = parseFloat(style.marginLeft) || 0;
                const marginR = parseFloat(style.marginRight) || 0;
                return { el, width: el.offsetWidth + marginL + marginR };
            });

            // Total width includes a gap between every item (including the wrap seam)
            const totalWidth = measurements.reduce((sum, m) => sum + m.width + gap, 0);

            // Nothing to animate if content fits
            if (totalWidth <= viewportWidth) {
                console.log("[carousel] content fits, no animation needed");
                return null;
            }

            // Position every item absolutely along the x-axis, preserving the gap
            let currentX = 0;
            measurements.forEach((m) => {
                gsap.set(m.el, { x: currentX, position: "absolute", left: 0, top: 0 });
                currentX += m.width + gap;
            });

            // Size the list to hold all items and track to clip overflow
            gsap.set(list, {
                position: "relative",
                width: totalWidth,
                height: Math.max(...items.map((el) => el.offsetHeight)),
            });
            gsap.set(track, { overflow: "hidden" });

            // Create one infinite tween per item
            const tweens = measurements.map((m) => {
                const duration = totalWidth / speed;

                return gsap.to(m.el, {
                    x: `-=${totalWidth}`,
                    duration,
                    ease: "none",
                    repeat: -1,
                    modifiers: {
                        x: (x) => {
                            const value = parseFloat(x);
                            // Wrap: once an item is fully off the left edge, move it to the right end
                            return `${value < -m.width ? value + totalWidth : value}px`;
                        },
                    },
                });
            });

            // Return a cleanup handle
            return {
                kill() {
                    tweens.forEach((t) => t.kill());
                },
                pause() {
                    tweens.forEach((t) => t.pause());
                },
                resume() {
                    tweens.forEach((t) => t.resume());
                },
            };
        }

        // Initialise
        const carousel = horizontalCarousel("[data-infinite-carousel='list']", 100 );
    });
})();