import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, Replace } from "lucide-react";
import { uploadPropertyMedia } from "@/lib/r2-upload";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
  subdir?: string;
  aspect?: string; // tailwind aspect class
  label?: string;
  accept?: string;
}

/**
 * Combined URL input + cloud upload + live preview.
 * Uploads files to R2 via the existing uploadPropertyMedia helper.
 */
export function MediaInput({
  value,
  onChange,
  subdir = "site",
  aspect = "aspect-[4/3]",
  label,
  accept = "image/*",
}: Props) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [pct, setPct] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    if (!userId) {
      toast.error("Sign in to upload");
      return;
    }
    const previous = value;
    setPct(0);
    try {
      const res = await uploadPropertyMedia(userId, file, subdir, setPct);
      onChange(res.url);
      if (previous) {
        toast.success("Image replaced", {
          description: "Previous image will be removed from the live site on save.",
          duration: 8000,
          action: { label: "Undo", onClick: () => onChange(previous) },
        });
      } else {
        toast.success("Uploaded");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setPct(null);
    }
  }

  function doClear() {
    const previous = value;
    onChange("");
    setConfirmClear(false);
    toast.success("Image removed", {
      description: "Save to apply. You can undo within 8 seconds.",
      duration: 8000,
      action: { label: "Undo", onClick: () => onChange(previous) },
    });
  }

  const uploading = pct !== null;

  return (
    <div className="space-y-2">
      {label && <div className="text-xs text-noir/60">{label}</div>}
      <div className={`relative ${aspect} bg-noir/5 rounded overflow-hidden border border-noir/10`}>
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-noir-deep/70 text-white grid place-items-center hover:bg-noir-deep"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {confirmClear && (
              <div className="absolute inset-0 bg-noir-deep/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white p-4 text-center">
                <div className="text-sm font-medium">Remove this image?</div>
                <div className="text-xs text-white/70">You can undo for 8 seconds after confirming.</div>
                <div className="flex gap-2">
                  <button
                    onClick={doClear}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-noir/40 text-xs gap-1">
            <ImageIcon className="w-6 h-6" />
            <span>No image</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-noir-deep/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <div className="w-2/3 h-1.5 bg-white/20 rounded overflow-hidden">
              <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[11px]">{pct}%</div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or upload below"
          className="flex-1 bg-noir/5 rounded px-3 py-2 text-sm"
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-noir text-white text-xs font-medium hover:bg-noir-deep disabled:opacity-50"
        >
          {value ? <Replace className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
          {value ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  );
}