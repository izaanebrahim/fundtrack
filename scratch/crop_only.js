const Jimp = require('jimp');

async function cropLogo() {
  try {
    const image = await Jimp.read('public/logo-wide-perfect.png');
    
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    let minX = w, minY = h, maxX = 0, maxY = 0;
    
    // 1. Find bounding box of the non-black content
    image.scan(0, 0, w, h, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If pixel is not pure black (with some tolerance for compression)
      if (r > 20 || g > 20 || b > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });
    
    console.log(`Cropping to: ${minX}, ${minY} to ${maxX}, ${maxY}`);
    
    // 2. Crop the image to the bounding box
    image.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);
    
    await image.writeAsync('public/logo-wide-perfect-cropped.png');
    console.log('Successfully cropped logo!');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

cropLogo();
