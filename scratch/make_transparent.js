const Jimp = require('jimp');

async function processLogo() {
  try {
    const image = await Jimp.read('public/logo-wide-perfect-cropped.png');
    image.rgba(true);
    
    // The background of this image is pure black or very close to it.
    // The text is white, and the icon is green.
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If pixel is very dark (black background) -> make it transparent
      if (r < 20 && g < 20 && b < 20) {
        this.bitmap.data[idx + 3] = 0; // Alpha to 0
      }
    });

    await image.writeAsync('public/logo-wide-transparent.png');
    console.log('Successfully made logo transparent!');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processLogo();
