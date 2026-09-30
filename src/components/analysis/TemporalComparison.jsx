import { useRef } from "react";
import useAnalysisStore from "../../store/analysisStore";
import useImageryStore from "../../store/imageryStore";

function TemporalComparison() {
  const inputRef = useRef(null);

  const query = useAnalysisStore((state) => state.query);
  const status = useAnalysisStore((state) => state.status);
  const task = useAnalysisStore((state) => state.task);

  const image = useImageryStore((state) => state.image);
  const temporalImage = useImageryStore((state) => state.temporalImage);
  const setTemporalImage = useImageryStore(
    (state) => state.setTemporalImage
  );
  const clearTemporalImage = useImageryStore(
    (state) => state.clearTemporalImage
  );

  const isTemporalTask =
    task === "multitemporal_change_analysis" ||
    task === "temporal_change_detection";

  const isTemporalQuery =
    /change|temporal|compare|comparison|difference|before|after|between/i.test(
      query || ""
    );

  const shouldShow = isTemporalTask || isTemporalQuery;

  if (!shouldShow) {
    return null;
  }

  const handleT2Upload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/tiff",
      "image/tif",
    ];

    const maxSize = 25 * 1024 * 1024;

    if (!supportedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.tif') && !file.name.toLowerCase().endsWith('.tiff')) {
      window.alert("Please upload a JPEG, PNG, WebP, or TIFF image.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      window.alert("Observation T2 must be smaller than 25 MB.");
      event.target.value = "";
      return;
    }

    const assetUrl = URL.createObjectURL(file);

    setTemporalImage({
      id: `temporal-${Math.random().toString(36).substring(2, 11)}`,
      source: "LOCAL UPLOAD",
      filename: file.name,
      assetUrl,
      acquisitionDate: null,
      modality: "unknown",
      file,
    });

    event.target.value = "";
  };

  const handleRemoveT2 = () => {
    clearTemporalImage();
  };

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[300px] -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b0b0c]/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[8px] font-medium tracking-[0.2em] text-white/40">
          TEMPORAL CONTEXT
        </p>

        {isTemporalTask && status === "complete" && (
          <span className="font-mono text-[8px] text-emerald-300">
            ANALYZED
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Observation T1 */}
        <div className="rounded-lg border border-white/8 bg-white/[0.025] p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-white/80">
              OBSERVATION T1
            </span>

            {image ? (
              <span className="font-mono text-[8px] text-emerald-300">
                ● LOADED
              </span>
            ) : (
              <span className="font-mono text-[8px] text-red-300">
                ● MISSING
              </span>
            )}
          </div>

          {image?.filename && (
            <p className="mt-1 truncate font-mono text-[7.5px] text-white/35">
              {image.filename}
            </p>
          )}
        </div>

        {/* Observation T2 */}
        <div className="rounded-lg border border-white/8 bg-white/[0.025] p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-white/80">
              OBSERVATION T2
            </span>

            {temporalImage ? (
              <span className="font-mono text-[8px] text-emerald-300">
                ● LOADED
              </span>
            ) : (
              <span className="font-mono text-[8px] text-amber-300">
                ○ REQUIRED
              </span>
            )}
          </div>

          {temporalImage ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate font-mono text-[7.5px] text-white/40">
                {temporalImage.filename}
              </p>

              <button
                type="button"
                onClick={handleRemoveT2}
                className="shrink-0 font-mono text-[7px] tracking-wider text-white/35 transition hover:text-white/80"
              >
                REMOVE
              </button>
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,image/jpeg,image/png,image/webp,image/tiff"
                onChange={handleT2Upload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-2 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 py-2 font-mono text-[8px] tracking-[0.12em] text-white/65 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                LOAD OBSERVATION T2
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 font-mono text-[7.5px] leading-relaxed text-white/35">
        Temporal analysis compares two uploaded observations. Ensure T1 and T2
        represent the same area and are reasonably co-registered.
      </p>
    </div>
  );
}

export default TemporalComparison;