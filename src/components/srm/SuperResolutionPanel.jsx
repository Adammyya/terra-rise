import React, { useState } from 'react';

const SuperResolutionPanel = () => {
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const handleEnhance = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('scale', scale);
    formData.append('baseline', 'true');

    try {
      const response = await fetch('http://localhost:8000/api/sr/enhance', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sr-panel">
      <h1>TerraRise</h1>
      <h2>Deep Learning Super-Resolution Mapping</h2>
      
      <div>
        <input type="file" onChange={handleImageUpload} />
        <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
        <button onClick={handleEnhance} disabled={loading || !image}>
          {loading ? 'Processing...' : 'Run Super-Resolution'}
        </button>
      </div>

      {result && (
        <div>
          <h3>Original vs Super-Resolved</h3>
          <div style={{display: 'flex'}}>
             <img src={URL.createObjectURL(image)} width="300" alt="original" />
             <img src={result.output.download_url} width="300" alt="enhanced" />
          </div>
          
          <h3>Baseline (Bicubic)</h3>
          <img src={result.output.bicubic_url} width="300" alt="baseline" />
          
          <h3>Quality Assessment</h3>
          <p>PSNR: {result.validation.psnr || 'Unavailable'}</p>
          <p>SSIM: {result.validation.ssim || 'Unavailable'}</p>
          <p>RMSE: {result.validation.rmse || 'Unavailable'}</p>
          
          <h3>Uncertainty</h3>
          <p>Level: {result.uncertainty.level}</p>
          <p>{result.uncertainty.description}</p>
        </div>
      )}
    </div>
  );
};

export default SuperResolutionPanel;
