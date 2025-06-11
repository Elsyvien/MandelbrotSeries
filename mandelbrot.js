function drawMandelbrot(canvas, ctx, zoom) {
    const width = canvas.width;
    const height = canvas.height;
    const maxIterations = 100;  
    console.log("Starte Berechnung der Mandelbrot-Menge");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Komplexer Zahlenraum
    const aspect = width / height;
    const xMin = -2.0 * aspect;
    const xMax = 1.0 * aspect;
    const yMin = -1.5;
    const yMax = 1.5;


    for(let px = 0; px < width; px++) {
        for(let py = 0; py < height; py++) {
            // Mappe Pixel auf komplexe Zahl c
            const x0 = xMin + (xMax - xMin) * px / width;
            const y0 = yMin + (yMax - yMin) * py / height;
            let x = 0;
            let y = 0;
            let iteration = 0;
            while(x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xTemp;
                iteration++;
            }
            const index = (px + py * width) * 4;
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

    drawMandelbrot(canvas, ctx, 1.0);
}




window.addEventListener("load", main);