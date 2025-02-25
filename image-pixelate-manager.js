function pixelateImage(canvas, imgUrl, width, height) {
    const ctx = canvas.getContext("2d");

    // Optionally update canvas dimensions if needed (this clears the canvas)
    canvas.width = 256;
    canvas.height = 256;

    // Create an offscreen canvas with the desired low resolution (width x height)
    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");

    // Load the image
    const img = new Image();
    img.src = imgUrl;

    img.onload = function () {
        // Draw the image scaled down to low resolution
        offCtx.drawImage(img, 0, 0, width, height);

        // Ensure the main canvas is clear and set our desired settings
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;  // Disable smoothing for that pixelated look

        // Draw the low-resolution image onto the main canvas scaled up to 256x256
        ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
    };
}
