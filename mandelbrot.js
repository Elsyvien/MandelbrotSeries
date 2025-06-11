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

function drawMandelbrot(canvas, ctx) {
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


    for (let px = 0; px < width; px++) {
        const x0 = xMin + xScale * px;
        for (let py = 0; py < height; py++) {
            // Mappe Pixel auf komplexe Zahl c
            const y0 = yMin + yScale * py;
            let x = 0;
            let y = 0;
            let iteration = 0;
            while(x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xTemp;
                iteration++;
            }
            const index = ((py * width) + px) << 2;
            // Setze Farbe basierend auf der Anzahl der Iterationen
            if (iteration === maxIterations) {
                // Punkt ist in der Mandelbrot-Menge → schwarz
                data[index + 0] = 0;
                data[index + 1] = 0;
                data[index + 2] = 0;
            } else {
                const hue = Math.floor(360 * iteration / maxIterations);
                const rgb = hslToRgb(hue / 360, 1, 0.5); // volle Sättigung, mittlere Helligkeit

                data[index + 0] = rgb[0];
                data[index + 1] = rgb[1];
                data[index + 2] = rgb[2];
            }
            data[index + 3] = 255;
        }
    }
    console.log("Fertig mit der Berechnung der Mandelbrot-Menge");
    ctx.putImageData(imageData, 0, 0);
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
        drawMandelbrot(canvas, ctx);
    });


    drawMandelbrot(canvas, ctx);
}

window.addEventListener("load", main);