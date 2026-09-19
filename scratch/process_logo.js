const Jimp = require('jimp');

async function processLogo() {
  try {
    const image = await Jimp.read('public/logo-wide.png');
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];

      // If mostly white background -> make transparent
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // Alpha to 0
      } 
      // If mostly dark/black (text and dark parts) -> make white
      else if (r < 80 && g < 100 && b < 100) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
      // Everything else (like the green) stays exactly the same
    });

    await image.writeAsync('public/logo-wide-processed.png');
    console.log('Successfully processed logo to public/logo-wide-processed.png');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processLogo();
