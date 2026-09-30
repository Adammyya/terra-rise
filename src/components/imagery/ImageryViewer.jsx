import { useRef, useState } from "react";
import useImageryStore from "../../store/imageryStore";

function ImageryViewer() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadError, setUploadError] = useState("");
  const resetView = () => {
  setZoom(1);
  setPan({ x: 0, y: 0 });
};
const fileInputRef = useRef(null);
const handleUpload = (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  setUploadError("");

  const supportedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/tif",
  ];

  const maxFileSize = 25 * 1024 * 1024;

  if (!supportedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.tif') && !file.name.toLowerCase().endsWith('.tiff')) {
    setUploadError("Unsupported format. Use JPG, PNG, WebP, or TIFF.");
    event.target.value = "";
    return;
  }

  if (file.size > maxFileSize) {
    setUploadError("File is too large. Maximum size is 25 MB.");
    event.target.value = "";
    return;
  }

  const assetUrl = URL.createObjectURL(file);

  setImage({
    id: `upload-${Math.random().toString(36).substring(2, 11)}`,
    source: "LOCAL UPLOAD",
    filename: file.name,
    assetUrl,
    acquisitionDate: null,
    modality: "unknown",
    file,
  });

  setZoom(1);
  setPan({ x: 0, y: 0 });

  event.target.value = "";
};

  const image = useImageryStore((state) => state.image);
const setImage = useImageryStore((state) => state.setImage);
const overlays = useImageryStore((state) => state.overlays);

  const handleMouseDown = (event) => {
    if (zoom === 1) {
      return;
    }

    setDragging(true);

    setDragStart({
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    });
  };

  const handleMouseMove = (event) => {
    if (!dragging) {
      return;
    }

    setPan({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  if (!image) {
    return (
      <div className="absolute inset-6 z-0 flex items-center justify-center rounded-2xl border border-white/10 bg-black">
        <p className="text-xs tracking-[0.2em] text-white/30">
          NO IMAGERY LOADED
        </p>
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-6 z-0 overflow-hidden rounded-2xl border border-white/10 bg-black ${
        zoom > 1
          ? dragging
            ? "cursor-grabbing"
            : "cursor-grab"
          : ""
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {image.file?.type === "image/tiff" || image.filename?.toLowerCase().endsWith(".tif") || image.filename?.toLowerCase().endsWith(".tiff") ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <p className="text-[10px] tracking-[0.2em] text-white/40">TIFF PREVIEW UNAVAILABLE</p>
          <p className="text-[8px] tracking-[0.1em] text-white/20 mt-2">File will be processed natively by the backend</p>
        </div>
      ) : (
        <img
          src={image.assetUrl}
          alt={`${image.source} satellite imagery`}
          className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-200"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          draggable={false}
        />
      )}
      {overlays.map((overlay, index) => {
  if (
    overlay.type !== "bounding_box" &&
    overlay.type !== "change_region"
  ) {
    return null;
  }

  const isChangeRegion = overlay.type === "change_region";

  return (
    <div
      key={`${overlay.type}-${index}`}
      className={`pointer-events-none absolute z-10 border ${
        isChangeRegion
          ? "border-cyan-300/80 bg-cyan-300/[0.10] shadow-[0_0_30px_rgba(103,232,249,0.12)]"
          : "border-amber-400/80 bg-amber-400/[0.08] shadow-[0_0_30px_rgba(251,191,36,0.12)]"
      }`}
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.width}%`,
        height: `${overlay.height}%`,
      }}
    >
      <div
        className={`absolute -top-6 left-0 whitespace-nowrap rounded-md border bg-black/75 px-2 py-1 text-[8px] tracking-[0.15em] backdrop-blur-md ${
          isChangeRegion
            ? "border-cyan-300/30 text-cyan-200"
            : "border-amber-400/30 text-amber-300"
        }`}
      >
        {overlay.label}
      </div>
    </div>
  );
})}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,11,12,0.5),transparent_30%)]" />
      <input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/webp,image/tiff,.tif,.tiff"
  onChange={handleUpload}
  className="hidden"
/>
{uploadError && (
  <div className="absolute right-5 top-[4.5rem] z-10 max-w-xs rounded-lg border border-red-400/20 bg-black/80 px-3 py-2 text-[9px] tracking-[0.08em] text-red-300 backdrop-blur-md">
    {uploadError}
  </div>
)}

<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className="absolute right-5 top-5 z-10 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-[9px] tracking-[0.2em] text-white/60 backdrop-blur-md transition-colors hover:border-amber-400/30 hover:text-white"
>
  UPLOAD IMAGERY
</button>
<div className="pointer-events-none absolute left-5 top-5 z-10 rounded-lg border border-white/10 bg-black/55 px-3 py-2.5 backdrop-blur-md">
  <p className="text-[9px] tracking-[0.25em] text-white/40">
    EARTH OBSERVATION
  </p>

  <p className="mt-1 text-xs text-white/80">
    {image.source}
  </p>

  <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
    <p className="text-[8px] tracking-[0.08em] text-white/35">
      FILE <span className="text-white/55">{image.filename}</span>
    </p>

    <p className="text-[8px] tracking-[0.08em] text-white/35">
      MODALITY{" "}
      <span className="text-white/55">
        {image.modality || "UNKNOWN"}
      </span>
    </p>

    {image.acquisitionDate && (
      <p className="text-[8px] tracking-[0.08em] text-white/35">
        ACQUIRED{" "}
        <span className="text-white/55">
          {image.acquisitionDate}
        </span>
      </p>
    )}
  </div>
</div>

      <div
        className="absolute bottom-5 right-5 z-10 flex overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur-md"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() =>
            setZoom((current) => Math.min(current + 0.25, 3))
          }
          className="px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          +
        </button>

        <div className="w-px bg-white/10" />

        <button
          type="button"
          onClick={() =>
            setZoom((current) => Math.max(current - 0.25, 1))
          }
          className="px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          −
        </button>
        <div className="w-px bg-white/10" />
        <div className="px-3 py-2 text-[9px] tracking-[0.12em] text-white/40">
  {Math.round(zoom * 100)}%
</div>

<div className="w-px bg-white/10" />

<button
  type="button"
  onClick={resetView}
  className="px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
  title="Reset view"
>
  ↺
</button>
      </div>
    </div>
  );
}

export default ImageryViewer;