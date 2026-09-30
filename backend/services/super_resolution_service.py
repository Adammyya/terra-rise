import cv2
from cv2 import dnn_superres
import os
import numpy as np
import rasterio
from skimage.metrics import peak_signal_noise_ratio as psnr, structural_similarity as ssim
import time

class SuperResolutionModel:
    def __init__(self, model_name="FSRCNN"):
        self.model_name = model_name
        self.supported_scales = [2, 4]
        self.sr_models = {}

    def load(self, scale):
        if scale not in self.supported_scales:
            raise ValueError(f"Scale {scale} not supported by {self.model_name}")
        if scale not in self.sr_models:
            sr = dnn_superres.DnnSuperResImpl_create()
            model_path = os.path.join(os.path.dirname(__file__), f"../models_weights/{self.model_name}_x{scale}.pb")
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            sr.readModel(model_path)
            sr.setModel(self.model_name.lower(), scale)
            self.sr_models[scale] = sr
        return self.sr_models[scale]

    def enhance(self, image_np, scale):
        sr = self.load(scale)
        return sr.upsample(image_np)

sr_model = SuperResolutionModel()

def calculate_metrics(img1, img2):
    # Ensure same size for metrics
    if img1.shape != img2.shape:
        img2_resized = cv2.resize(img2, (img1.shape[1], img1.shape[0]), interpolation=cv2.INTER_CUBIC)
    else:
        img2_resized = img2
    
    p = psnr(img1, img2_resized, data_range=255)
    s = ssim(img1, img2_resized, multichannel=True, channel_axis=-1, data_range=255)
    rmse = np.sqrt(np.mean((img1.astype(np.float32) - img2_resized.astype(np.float32)) ** 2))
    return p, s, rmse

def compute_uncertainty(original_np, enhanced_np, scale):
    # Heuristic uncertainty based on variance in the bicubic vs sr image
    bicubic = cv2.resize(original_np, (enhanced_np.shape[1], enhanced_np.shape[0]), interpolation=cv2.INTER_CUBIC)
    diff = np.abs(enhanced_np.astype(np.float32) - bicubic.astype(np.float32))
    mean_diff = np.mean(diff)
    
    if mean_diff < 5:
        level = "LOW"
        desc = "Reconstruction closely matches baseline upsampling. High confidence."
    elif mean_diff < 15:
        level = "MODERATE"
        desc = "Moderate reconstruction changes. Review fine details."
    else:
        level = "HIGH"
        desc = "High uncertainty: the input observation contains limited high-frequency information in this region, so fine structures are model-reconstructed."
        
    return {
        "level": level,
        "mean_difference": float(mean_diff),
        "description": desc
    }
