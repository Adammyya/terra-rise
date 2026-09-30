from fastapi.testclient import TestClient
from backend.main import app
import io
from PIL import Image

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "TerraRise AI Super-Resolution Workstation"

def test_sr_enhance():
    # Create a dummy image
    img = Image.new('RGB', (64, 64), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()

    response = client.post(
        "/api/sr/enhance",
        data={"scale": 2, "baseline": True},
        files={"image": ("test.png", img_byte_arr, "image/png")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["scale"] == 2
    assert data["output"]["width"] == 128
    assert data["output"]["height"] == 128
    assert "bicubic_url" in data["output"]
