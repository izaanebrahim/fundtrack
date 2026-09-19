const Jimp = require('jimp');

async function analyzeLogo() {
  const img = await Jimp.read('public/logo-wide.png');
  
  console.log("Top left pixel: ", Jimp.intToRGBA(img.getPixelColor(0, 0)));
  console.log("Center pixel: ", Jimp.intToRGBA(img.getPixelColor(img.bitmap.width/2, img.bitmap.height/2)));
  console.log("Bottom right pixel: ", Jimp.intToRGBA(img.getPixelColor(img.bitmap.width-1, img.bitmap.height-1)));
}

analyzeLogo();
