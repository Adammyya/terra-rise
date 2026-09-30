import urllib.request
import os

def download_file(url, filename):
    if not os.path.exists(filename):
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(url, filename)
        print("Done.")
    else:
        print(f"{filename} already exists.")

if __name__ == "__main__":
    os.makedirs("backend/models_weights", exist_ok=True)
    models = {
        "backend/models_weights/FSRCNN_x2.pb": "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x2.pb",
        "backend/models_weights/FSRCNN_x4.pb": "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x4.pb"
    }
    for path, url in models.items():
        download_file(url, path)
