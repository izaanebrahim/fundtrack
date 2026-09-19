const Jimp = require('jimp');

async function processLogo() {
  try {
    const image = await Jimp.read('public/logo-wide.png');
    image.rgba(true);
    
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    let minX = w, minY = h, maxX = 0, maxY = 0;
    
    // 1. Find bounding box of the non-black content (the white rectangle)
    image.scan(0, 0, w, h, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If pixel is not black
      if (r > 50 || g > 50 || b > 50) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });
    
    console.log(`Cropping to: ${minX}, ${minY} to ${maxX}, ${maxY}`);
    
    // 2. Crop the image to the bounding box
    image.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);
    
    // 3. Process the cropped image
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If it's light (background) -> transparent
      if (r > 200 && g > 200 && b > 200) {
        this.bitmap.data[idx + 0] = 0;
        this.bitmap.data[idx + 1] = 0;
        this.bitmap.data[idx + 2] = 0;
        this.bitmap.data[idx + 3] = 0;
      } 
      // If it's dark (text/shapes) -> white
      else if (r < 100 && g < 100 && b < 100) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
        this.bitmap.data[idx + 3] = 255;
      }
    });

    await image.writeAsync('public/logo-wide-perfect.png');
    console.log('Successfully processed and cropped logo!');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processLogo();
