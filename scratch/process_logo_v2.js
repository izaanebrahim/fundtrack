const Jimp = require('jimp');

async function processLogo() {
  try {
    const image = await Jimp.read('public/logo-wide.png');
    
    image.rgba(true); // Ensure alpha channel exists

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If it's very light (background) -> transparent
      if (r > 200 && g > 200 && b > 200) {
        this.bitmap.data[idx + 3] = 0; 
      } 
      // If it's very dark (text/shapes) -> white
      else if (r < 100 && g < 100 && b < 100) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
        this.bitmap.data[idx + 3] = 255;
      }
    });

    await image.writeAsync('public/logo-wide-processed-v2.png');
    console.log('Successfully processed logo to public/logo-wide-processed-v2.png');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processLogo();
