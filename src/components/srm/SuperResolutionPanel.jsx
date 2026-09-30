import React, { useState } from 'react';
import ModelSelector from './ModelSelector';
import SRComparisonViewer from './SRComparisonViewer';
import QualityMetrics from './QualityMetrics';
import UncertaintyPanel from './UncertaintyPanel';
import SpectralConsistency from './SpectralConsistency';
import MetadataPanel from './MetadataPanel';
import BaselineComparison from './BaselineComparison';

const SuperResolutionPanel = () => {
  const [image, setImage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [reference, setReference] = useState(null);
  const [scale, setScale] = useState(4);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImageSrc(URL.createObjectURL(file));
      setResult(null); // Reset on new image
    }
  };

  const handleRefUpload = (e) => {
    const file = e.target.files[0];
    if (file) setReference(file);
  };

  const handleEnhance = async () => {
    console.log("TerraRise SR run started");
    console.log("File:", image?.name);
    console.log("Scale:", scale);
    console.log("Reference:", !!reference);

    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('scale', scale);
    formData.append('baseline', 'true');
    
    if (reference) {
      formData.append('reference_image', reference);
    }

    try {
      const response = await fetch('http://localhost:8000/api/sr/enhance', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log("Response:", data);
      
      if (!data.success) {
         throw new Error(data.error || 'Server returned failure');
      }
      
      setResult(data);
    } catch (err) {
      console.error("[SR ERROR]:", err);
      alert("Failed to process image: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 lg:p-8 font-sans">
      <header className="mb-8 border-b border-[#2a2a2e] pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-[#eaeaea] tracking-tight">Terra<span className="font-semibold text-cyan-400">Rise</span></h1>
          <p className="text-sm text-[#8a8a8e] uppercase tracking-widest mt-1">Deep Learning Super-Resolution Mapping</p>
        </div>
        <div className="text-xs text-[#5a5a5e] font-mono border border-[#2a2a2e] px-3 py-1 rounded bg-[#141416]">
          SIH26142 Edition
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex flex-col gap-4 bg-[#0b0b0c] p-4 border border-[#2a2a2e] rounded-lg">
            <h3 className="text-xs text-[#8a8a8e] uppercase tracking-widest font-semibold">Input Observation</h3>
            
            <div className="border-2 border-dashed border-[#2a2a2e] hover:border-[#5a5a5e] rounded-md p-6 text-center transition-colors relative cursor-pointer group bg-[#111112]">
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/tiff" 
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-xs text-[#8a8a8e] group-hover:text-[#eaeaea] transition-colors">
                {image ? image.name : 'Upload Medium-Res Imagery'}
              </span>
            </div>

            <div className="border border-dashed border-[#2a2a2e] hover:border-[#5a5a5e] rounded-md p-4 text-center transition-colors relative cursor-pointer group bg-[#111112]">
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/tiff" 
                onChange={handleRefUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-[10px] text-[#5a5a5e] group-hover:text-[#8a8a8e] transition-colors uppercase tracking-wider">
                {reference ? reference.name : '+ Optional High-Res Ref'}
              </span>
            </div>
          </div>

          <ModelSelector 
            scale={scale} 
            setScale={setScale} 
            onRun={handleEnhance} 
            loading={loading} 
            hasImage={!!image} 
          />

          {result && (
            <div className="flex flex-col gap-6 mt-4">
              <QualityMetrics validation={result.validation} />
              <UncertaintyPanel uncertainty={result.uncertainty} />
            </div>
          )}
        </div>

        {/* Main Workspace - Viewer & Analysis */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          {loading ? (
            <div className="w-full h-[600px] border border-[#2a2a2e] rounded-lg bg-[#0b0b0c] flex items-center justify-center flex-col gap-4">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-cyan-400 font-mono uppercase tracking-widest animate-pulse">Running Neural Reconstruction...</span>
            </div>
          ) : result ? (
            <div className="flex flex-col gap-6">
              <SRComparisonViewer 
                originalSrc={imageSrc} 
                enhancedSrc={result.output.download_url} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetadataPanel 
                  input={result.input} 
                  output={result.output} 
                  model={result.model} 
                  processingTime={result.processing_time} 
                />
                <SpectralConsistency spectralValidation={result.spectral_validation} />
              </div>
              
              <BaselineComparison 
                bicubicUrl={result.output.bicubic_url} 
                enhancedUrl={result.output.download_url} 
              />
              
              <div className="border border-[#2a2a2e] rounded-lg bg-[#0b0b0c] p-4 flex justify-between items-center mt-4">
                <span className="text-[11px] text-[#8a8a8e] max-w-xl leading-relaxed">
                  <strong>Scientific Notice:</strong> {result.limitations[0]}
                </span>
                <a 
                  href={result.output.download_url} 
                  download="terrarise_enhanced.png"
                  className="px-4 py-2 bg-[#1a1a1c] hover:bg-[#2a2a2e] border border-[#3a3a3e] rounded text-xs text-[#eaeaea] uppercase tracking-widest font-semibold transition-colors"
                >
                  Export TIFF / PNG
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full h-[600px] border border-[#2a2a2e] rounded-lg bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1c] to-[#0b0b0c] flex items-center justify-center">
              <div className="text-center flex flex-col gap-2 items-center opacity-50">
                <div className="w-16 h-16 border border-[#2a2a2e] rounded flex items-center justify-center mb-2">
                  <span className="text-[#5a5a5e]">🌍</span>
                </div>
                <span className="text-sm text-[#8a8a8e] uppercase tracking-widest">Workspace Idle</span>
                <span className="text-[10px] text-[#5a5a5e] max-w-xs">Upload medium-resolution imagery and select run to begin reconstruction.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperResolutionPanel;
