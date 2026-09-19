from PIL import Image
import sys

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # item is (R, G, B, A)
        r, g, b, a = item
        
        # If the pixel is mostly white (background), make it transparent
        if r > 240 and g > 240 and b > 240:
            newData.append((255, 255, 255, 0))
        # If the pixel is dark (the text and dark parts of the logo), make it white
        elif r < 80 and g < 100 and b < 100:
            # We keep the original alpha just in case, but usually it's 255
            # We want to make it white
            newData.append((255, 255, 255, a))
        else:
            # Leave the green pixels (and any other colored pixels) mostly intact
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Successfully processed logo and saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_logo.py <input> <output>")
    else:
        process_logo(sys.argv[1], sys.argv[2])
