const Jimp = require('jimp');

async function checkLogo() {
  const img = await Jimp.read('public/logo-wide-processed-v2.png');
  let whiteCount = 0;
  let blackCount = 0;
  let transparentCount = 0;
  
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    
    if (a === 0) transparentCount++;
    else if (r > 200 && g > 200 && b > 200) whiteCount++;
    else if (r < 50 && g < 50 && b < 50) blackCount++;
  });
  
  console.log(`Dimensions: ${img.bitmap.width}x${img.bitmap.height}`);
  console.log(`Transparent pixels: ${transparentCount}`);
  console.log(`White pixels: ${whiteCount}`);
  console.log(`Black pixels: ${blackCount}`);
}

checkLogo();
