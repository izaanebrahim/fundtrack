const Jimp = require('jimp');
const fs = require('fs');

async function processLogo() {
  try {
    // Read the newly uploaded image from artifacts
    const image = await Jimp.read('C:\\Users\\izaan\\.gemini\\antigravity-ide\\brain\\cb6c7a5f-b124-45ba-85fa-b266331fc34f\\.user_uploaded\\media_1789814640491.png');
    image.rgba(true);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If pixel is light/white (background) -> transparent
      if (r > 200 && g > 200 && b > 200) {
        this.bitmap.data[idx + 0] = 0;
        this.bitmap.data[idx + 1] = 0;
        this.bitmap.data[idx + 2] = 0;
        this.bitmap.data[idx + 3] = 0;
      } 
      // If pixel is dark slate/grey (text and circle) -> make it pure WHITE
      else if (r < 100 && g < 100 && b < 100) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
        this.bitmap.data[idx + 3] = 255;
      }
      // Green stays as is
    });

    await image.writeAsync('public/logo-square-dark.png');
    
    // Create a black-text version just in case they really meant black
    const image2 = await Jimp.read('C:\\Users\\izaan\\.gemini\\antigravity-ide\\brain\\cb6c7a5f-b124-45ba-85fa-b266331fc34f\\.user_uploaded\\media_1789814640491.png');
    image2.rgba(true);
    image2.scan(0, 0, image2.bitmap.width, image2.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If pixel is light/white (background) -> transparent
      if (r > 200 && g > 200 && b > 200) {
        this.bitmap.data[idx + 3] = 0;
      } 
      // If pixel is dark slate/grey (text and circle) -> make it pure BLACK
      else if (r < 100 && g < 100 && b < 100) {
        this.bitmap.data[idx + 0] = 0;
        this.bitmap.data[idx + 1] = 0;
        this.bitmap.data[idx + 2] = 0;
        this.bitmap.data[idx + 3] = 255;
      }
    });
    
    await image2.writeAsync('public/logo-square-black.png');
    
    console.log('Successfully processed both logos!');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processLogo();
