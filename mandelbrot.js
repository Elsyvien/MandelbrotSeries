function drawMandelbrot(canvas, ctx) {
    const width = canvas.width;
    const height = canvas.height;
    const maxIterations = 100;
    const zoom = 1;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Komplexer Zahlenraum
    const xMin = -2.0 / zoom;
    const xMax = 1.0 / zoom;
    const yMin = -1.5 / zoom;
    const yMax = 1.5 / zoom;

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
            // Farbe basierend auf der Anzahl der Iterationen
            let color;
            if (iteration === maxIterations) {
                color = 0;
            } else {
                color = (iteration * 255) / maxIterations;
            }
            const index = (px + py * width) * 4;
            data[index] = color;     // Rot
            data[index + 1] = color; // Grün
            data[index + 2] = color; // Blau
            data[index + 3] = 255;   // Alpha
        }
    }
    ctx.putImageData(imageData, 0, 0);
}




function main() {
    const canvas = document.getElementById("mandelbrotCanvas");
    const ctx = canvas.getContext("2d");

    drawMandelbrot(canvas, ctx);
}




window.addEventListener("load", main);