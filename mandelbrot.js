// Mandelbrot Renderer mit Zoom, Pan und Caching

let canvas, ctx;
// Haupt-Canvas und Zeichenkontext
let offscreenCanvas, offscreenCtx;
// Offscreen-Canvas zum Vorberechnen der naechsten Zoomstufen

const zoomCache = {};
// Cache fuer bereits gerenderte Viewports
let lastZoomPoint = { x: 0.5, y: 0.5 };
// Letzte Zoomposition fuer weiteres Pre-Caching

// Startbereich im komplexen Raum
let viewport = {
    xMin: -2.0,
    xMax: 1.0,
    yMin: -1.5,
    yMax: 1.5
};

// Iterationszahl je nach aktuellem Zoomlevel bestimmen
function getMaxIterations() {
    const width = viewport.xMax - viewport.xMin;
    // Erhöhe iterations Count basierend auf dem Zoomlevel
    const zoomFactor = Math.max(1, Math.log2(3 / width));
    return Math.floor(100 + zoomFactor * 50);
}

// Erzeugt einen eindeutigen String fuer den Cache
function viewportKey(vp) {
    return [vp.xMin, vp.xMax, vp.yMin, vp.yMax].map(n => n.toFixed(5)).join(',');
}

// Kopiert ein Viewport-Objekt
function cloneViewport(vp) {
    return { xMin: vp.xMin, xMax: vp.xMax, yMin: vp.yMin, yMax: vp.yMax };
}

// Berechnet einen neuen Ausschnitt nach einem Zoomvorgang
function computeZoomViewport(vp, cx, cy, scale, canvas) {
    const x = vp.xMin + (vp.xMax - vp.xMin) * (cx / canvas.width);
    const y = vp.yMin + (vp.yMax - vp.yMin) * (cy / canvas.height);
    const newWidth = (vp.xMax - vp.xMin) * scale;
    const newHeight = (vp.yMax - vp.yMin) * scale;
    return {
        xMin: x - newWidth * (cx / canvas.width),
        xMax: x + newWidth * (1 - cx / canvas.width),
        yMin: y - newHeight * (cy / canvas.height),
        yMax: y + newHeight * (1 - cy / canvas.height)
    };
}

// Rendert die naechsten Zoomstufen im Hintergrund vor
function precacheNext(vp, cx, cy) {
    const zoomFactor = 0.9;
    const inVp = computeZoomViewport(vp, cx, cy, zoomFactor, canvas);
    const outVp = computeZoomViewport(vp, cx, cy, 1 / zoomFactor, canvas);

    [inVp, outVp].forEach(target => {
        const key = viewportKey(target);
        if (!zoomCache[key]) {
            drawMandelbrot(offscreenCanvas, offscreenCtx, false, imageData => {
                zoomCache[key] = imageData;
            }, target);
        }
    });
}

// Zeichnet die Mandelbrot-Menge auf das angegebene Canvas
function drawMandelbrot(canvas, ctx, animate=false, onDone=null, vpOverride=null) {
    const vp = vpOverride ? vpOverride : viewport;
    const width = canvas.width;
    const height = canvas.height;
    const maxIterations = getMaxIterations();
    console.log("Starte Berechnung der Mandelbrot-Menge");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const aspect = width / height;

    // Komplexer Zahlenraum
    const xMin = vp.xMin * aspect;
    const xMax = vp.xMax * aspect;
    const yMin = vp.yMin;
    const yMax = vp.yMax;

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

// Einfache Farbpalette fuer die Darstellung
    function palette(t) {
        const r = Math.floor(9 * (1 - t) * t * t * t * 255);
        const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
        const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
        return [r, g, b];
    }

// Pixel in das ImageData schreiben
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

    // Bei Bedarf Fraktal schrittweise aufbauen
    if (animate) {
        let limit = 1;
        function step() {
            render(limit);
            if (limit < maxIterations) {
                limit++;
                requestAnimationFrame(step);
            } else if (onDone) {
                onDone(imageData);
            }
        }
        step();
    // Komplettes Bild auf einmal zeichnen
    } else {
        render(maxIterations);
        if (onDone) onDone(imageData);
    }
}

// Umrechnung von HSL nach RGB (aktuell nicht genutzt, bleibt fuer Experimente)
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

// Initialisierung und Event-Handler
function main() {
    canvas = document.getElementById("mandelbrotCanvas");
    ctx = canvas.getContext("2d");
    offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    offscreenCtx = offscreenCanvas.getContext("2d");
    // DOM-Elemente und Zustand initialisieren
    const animateToggle = document.getElementById("animateToggle");
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    // Zoomen per Mausrad
    canvas.addEventListener("wheel", function(event) {
        event.preventDefault();
        const zoomFactor = 0.9;
        const scale = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        const rect = canvas.getBoundingClientRect();
        const cx = event.clientX - rect.left;
        const cy = event.clientY - rect.top;

        viewport = computeZoomViewport(viewport, cx, cy, scale, canvas);
        const key = viewportKey(viewport);
        lastZoomPoint = { x: cx / canvas.width, y: cy / canvas.height };

        if (zoomCache[key]) {
            ctx.putImageData(zoomCache[key], 0, 0);
            precacheNext(viewport, cx, cy);
        } else {
    // Erstes Rendering und Cache fuellen
            drawMandelbrot(canvas, ctx, animateToggle.checked, data => {
                zoomCache[key] = data;
                precacheNext(viewport, cx, cy);
            }, viewport);
        }
    });

    // Start des Verschiebens
    canvas.addEventListener("mousedown", (event) => {
        dragging = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
    });

    // Solange Maus gedrueckt ist: verschieben
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
    // Erstes Rendering und Cache fuellen
        drawMandelbrot(canvas, ctx, animateToggle.checked, data => {
            zoomCache[viewportKey(viewport)] = data;
            precacheNext(viewport, canvas.width * lastZoomPoint.x, canvas.height * lastZoomPoint.y);
        });
    });

    // Verschieben beenden
    canvas.addEventListener("mouseup", () => { dragging = false; });
    // Verschieben abbrechen falls Maus den Canvas verlaesst
    canvas.addEventListener("mouseleave", () => { dragging = false; });

    // Option zum Animieren umschalten
    animateToggle.addEventListener("change", () => {
    // Erstes Rendering und Cache fuellen
        drawMandelbrot(canvas, ctx, animateToggle.checked, data => {
            zoomCache[viewportKey(viewport)] = data;
            precacheNext(viewport, canvas.width * lastZoomPoint.x, canvas.height * lastZoomPoint.y);
        });
    });

    // Erstes Rendering und Cache fuellen
    drawMandelbrot(canvas, ctx, animateToggle.checked, data => {
        zoomCache[viewportKey(viewport)] = data;
        precacheNext(viewport, canvas.width * lastZoomPoint.x, canvas.height * lastZoomPoint.y);
    });
}

// Skript starten sobald die Seite geladen ist
window.addEventListener("load", main);
