let canvas, ctx;

let viewport = {
    xMin: -2.0,
    xMax: 1.0,
    yMin: -1.5,
    yMax: 1.5
};

function getMaxIterations() {
    const width = viewport.xMax - viewport.xMin;
    // Increase iteration count logarithmically with zoom level
    const zoomFactor = Math.max(1, Math.log2(3 / width));
    return Math.floor(100 + zoomFactor * 50);
}

function drawMandelbrot(canvas, ctx, animate=false) {
    const width = canvas.width;
    const height = canvas.height;
    const maxIterations = getMaxIterations();
    console.log("Starte Berechnung der Mandelbrot-Menge");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const aspect = width / height;

    // Komplexer Zahlenraum
    const xMin = viewport.xMin * aspect;
    const xMax = viewport.xMax * aspect;
    const yMin = viewport.yMin;
    const yMax = viewport.yMax;

    const xScale = (xMax - xMin) / width;
    const yScale = (yMax - yMin) / height;

    // Iterationswerte vorberechnen
    const iterations = new Uint16Array(width * height);
    let idx = 0;
    for (let py = 0; py < height; py++) {
        const y0 = yMin + yScale * py;
        for (let px = 0; px < width; px++) {
            const x0 = xMin + xScale * px;
            let x = 0;
            let y = 0;
            let iteration = 0;
            while (x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xTemp;
                iteration++;
            }
            iterations[idx++] = iteration;
        }
    }

    function palette(t) {
        const r = Math.floor(9 * (1 - t) * t * t * t * 255);
        const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
        const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
        return [r, g, b];
    }

    function render(limit) {
        let i = 0;
        for (let k = 0; k < iterations.length; k++) {
            const iter = Math.min(iterations[k], limit);
            if (iter === limit) {
                data[i++] = 0;
                data[i++] = 0;
                data[i++] = 0;
            } else {
                const rgb = palette(iter / maxIterations);
                data[i++] = rgb[0];
                data[i++] = rgb[1];
                data[i++] = rgb[2];
            }
            data[i++] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    if (animate) {
        let limit = 1;
        function step() {
            render(limit);
            if (limit < maxIterations) {
                limit++;
                requestAnimationFrame(step);
            }
        }
        step();
    } else {
        render(maxIterations);
    }
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = function (p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function main() {
    const canvas = document.getElementById("mandelbrotCanvas");
    const ctx = canvas.getContext("2d");
    const animateToggle = document.getElementById("animateToggle");
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener("wheel", function(event) {
        event.preventDefault();
        const zoomFactor = 0.9;
        const scale = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        const rect = canvas.getBoundingClientRect();
        const cx = event.clientX - rect.left;
        const cy = event.clientY - rect.top;    
        const x = viewport.xMin + (viewport.xMax - viewport.xMin) * (cx / canvas.width);
        const y = viewport.yMin + (viewport.yMax - viewport.yMin) * (cy / canvas.height);   
        const newWidth = (viewport.xMax - viewport.xMin) * scale;
        const newHeight = (viewport.yMax - viewport.yMin) * scale;  
        viewport.xMin = x - newWidth * (cx / canvas.width);
        viewport.xMax = x + newWidth * (1 - cx / canvas.width);
        viewport.yMin = y - newHeight * (cy / canvas.height);
        viewport.yMax = y + newHeight * (1 - cy / canvas.height);
        drawMandelbrot(canvas, ctx, animateToggle.checked);
    });

    canvas.addEventListener("mousedown", (event) => {
        dragging = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
    });

    canvas.addEventListener("mousemove", (event) => {
        if (!dragging) return;
        const dx = event.offsetX - lastX;
        const dy = event.offsetY - lastY;
        lastX = event.offsetX;
        lastY = event.offsetY;
        const deltaX = dx * (viewport.xMax - viewport.xMin) / canvas.width;
        const deltaY = dy * (viewport.yMax - viewport.yMin) / canvas.height;
        viewport.xMin -= deltaX;
        viewport.xMax -= deltaX;
        viewport.yMin -= deltaY;
        viewport.yMax -= deltaY;
        drawMandelbrot(canvas, ctx, animateToggle.checked);
    });

    canvas.addEventListener("mouseup", () => { dragging = false; });
    canvas.addEventListener("mouseleave", () => { dragging = false; });

    animateToggle.addEventListener("change", () => {
        drawMandelbrot(canvas, ctx, animateToggle.checked);
    });

    drawMandelbrot(canvas, ctx, animateToggle.checked);
}

window.addEventListener("load", main);
