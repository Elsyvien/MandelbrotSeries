function drawMandelbrot(canvas, ctx) {
    const width = canvas.width;
    const height = canvas.height;
    const maxIterations = 100;
    const zoom = 1.0; // Zoomfaktor, kann angepasst werden
    console.log("Starte Berechnung der Mandelbrot-Menge");
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
            console.log("Pixel:", px, py, "Iteration:", iteration);
            // Farbe basierend auf der Anzahl der Iterationen
            let color;
            const index = (px + py * width) * 4;
            if (iteration === maxIterations) {
                data[index] = 0;     // Rot
                data[index + 1] = 0; // Grün
                data[index + 2] = 0; // Blau
            } else {
                // Einfache Farbkombination, z.B. Verlauf
                data[index] = (iteration * 9) % 256;      // Rot
                data[index + 1] = (iteration * 7) % 256;  // Grün
                data[index + 2] = (iteration * 5) % 256; // Blau
            }
            data[index + 3] = 255;   // Alpha
        }
    }
    console.log("Fertig mit der Berechnung der Mandelbrot-Menge");
    ctx.putImageData(imageData, 0, 0);
}




function main() {
    const canvas = document.getElementById("mandelbrotCanvas");
    const ctx = canvas.getContext("2d");

    drawMandelbrot(canvas, ctx);
}




window.addEventListener("load", main);