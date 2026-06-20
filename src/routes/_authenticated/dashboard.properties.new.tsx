import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Plus, LayoutDashboard, Upload, X, Loader2 } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/use-auth";
import { createProperty, uploadPropertyImage, IMAGE_SECTIONS, type ImageSection } from "@/lib/properties-db";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/properties/new")({
  head: () => ({ meta: [{ title: "Add Property — NOVAWORKS" }] }),
  component: NewProperty,
});

const NAV = [
  { to: "/dashboard/it", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/properties", label: "All Properties", icon: Building2, group: "Content" },
  { to: "/dashboard/properties/new", label: "Add Property", icon: Plus, group: "Content" },
];

function NewProperty() {
  const { user, primaryRole, roles } = useAuth();
  const navigate = useNavigate();
  const canManage = roles.includes("it") || roles.includes("admin");
  const role = (canManage ? (roles.includes("it") ? "it" : "admin") : (primaryRole as any) ?? "buyer");

  useEffect(() => {
    if (roles.length && !canManage) {
      toast.error("Only NOVAWORKS staff can add properties.");
      navigate({ to: dashboardPathFor((primaryRole as any) ?? "buyer") });
    }
  }, [roles, canManage, primaryRole, navigate]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    property_type: "residential",
    listing_type: "sale",
    price: "",
    currency: "USD",
    bedrooms: "",
    bathrooms: "",
    area_sqm: "",
    address: "",
    city: "Kigali",
    district: "",
    lat: "",
    lng: "",
    amenities: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [sections, setSections] = useState<ImageSection[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 10 - files.length);
    setFiles((prev) => [...prev, ...arr]);
    setPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
    setSections((prev) => [...prev, ...arr.map(() => "main" as ImageSection)]);
  };

  const removeFile = (i: number) => {
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
    setSections((p) => p.filter((_, idx) => idx !== i));
  };

  const setSection = (i: number, s: ImageSection) =>
    setSections((p) => p.map((cur, idx) => (idx === i ? s : cur)));

  const submit = async (status: "draft" | "active") => {
    if (!user) return;
    if (!form.title.trim() || !form.price) {
      toast.error("Title and price are required");
      return;
    }
    setSubmitting(true);
    setUploadProgress(files.map(() => 0));
    try {
      const uploads = [] as Array<{ url: string; path: string; section: ImageSection }>;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        // simulated incremental progress while the upload is in flight
        const tick = setInterval(() => {
          setUploadProgress((p) => {
            const next = [...p];
            if (next[i] < 90) next[i] = Math.min(90, next[i] + 7);
            return next;
          });
        }, 120);
        try {
          const r = await uploadPropertyImage(user.id, f);
          uploads.push({ ...r, section: sections[i] ?? "main" });
          setUploadProgress((p) => { const n = [...p]; n[i] = 100; return n; });
        } finally {
          clearInterval(tick);
        }
      }
      await createProperty({
        ownerId: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        property_type: form.property_type,
        listing_type: form.listing_type,
        price: Number(form.price),
        currency: form.currency,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
        status,
        images: uploads,
      });
      toast.success(status === "active" ? "Property published" : "Draft saved");
      navigate({ to: "/dashboard/properties" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save property");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell
      title="Add New Property"
      subtitle="Fill in the details, upload media, and publish"
      role={role}
      nav={[...NAV, { to: dashboardPathFor(role), label: "Back to dashboard", icon: LayoutDashboard, group: "Overview" }]}
      actions={[
        { label: "Save Draft", onClick: () => submit("draft") },
        { label: submitting ? "Publishing…" : "Publish", icon: submitting ? Loader2 : Plus, onClick: () => submit("active"), variant: "primary" },
      ]}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Basics" subtitle="Title, description, and type">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title" full>
                <input className="input-luxe" value={form.title} onChange={update("title")} placeholder="Kigali Heights Luxury Penthouse" />
              </Field>
              <Field label="Property type">
                <select className="input-luxe" value={form.property_type} onChange={update("property_type")}>
                  <option value="residential">Residential</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                  <option value="office">Office</option>
                </select>
              </Field>
              <Field label="Listing type">
                <select className="input-luxe" value={form.listing_type} onChange={update("listing_type")}>
                  <option value="sale">For sale</option>
                  <option value="rent">For rent</option>
                </select>
              </Field>
              <Field label="Price" >
                <input className="input-luxe" type="number" value={form.price} onChange={update("price")} placeholder="0" />
              </Field>
              <Field label="Currency">
                <select className="input-luxe" value={form.currency} onChange={update("currency")}>
                  <option>USD</option><option>EUR</option><option>RWF</option>
                </select>
              </Field>
              <Field label="Bedrooms"><input className="input-luxe" type="number" value={form.bedrooms} onChange={update("bedrooms")} /></Field>
              <Field label="Bathrooms"><input className="input-luxe" type="number" value={form.bathrooms} onChange={update("bathrooms")} /></Field>
              <Field label="Area (m²)"><input className="input-luxe" type="number" value={form.area_sqm} onChange={update("area_sqm")} /></Field>
              <Field label="Description" full>
                <textarea className="input-luxe min-h-32" value={form.description} onChange={update("description")} placeholder="Describe the property…" />
              </Field>
              <Field label="Amenities (comma separated)" full>
                <input className="input-luxe" value={form.amenities} onChange={update("amenities")} placeholder="Pool, Gym, 24/7 Security" />
              </Field>
            </div>
          </Panel>

          <Panel title="Location" subtitle="Address and coordinates">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Address" full><input className="input-luxe" value={form.address} onChange={update("address")} /></Field>
              <Field label="City"><input className="input-luxe" value={form.city} onChange={update("city")} /></Field>
              <Field label="District"><input className="input-luxe" value={form.district} onChange={update("district")} /></Field>
              <Field label="Latitude"><input className="input-luxe" value={form.lat} onChange={update("lat")} placeholder="-1.9536" /></Field>
              <Field label="Longitude"><input className="input-luxe" value={form.lng} onChange={update("lng")} placeholder="30.0606" /></Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Media" subtitle="First image becomes the cover">
            <label className="border-2 border-dashed border-noir/15 rounded-xl p-6 text-center cursor-pointer block hover:border-gold transition">
              <Upload className="h-6 w-6 mx-auto text-noir/40" />
              <div className="mt-2 text-sm font-medium">Click to upload</div>
              <div className="text-xs text-noir/50">JPG, PNG, WebP · up to 10 images</div>
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={src} className="relative aspect-square rounded-md overflow-hidden bg-noir/5 group">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-gold text-noir-deep text-[10px] px-1.5 py-0.5 rounded">COVER</span>}
                    <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                    {submitting && uploadProgress[i] !== undefined && (
                      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
                        <div className="h-full bg-gold transition-all duration-150" style={{ width: `${uploadProgress[i]}%` }} />
                      </div>
                    )}
                    {submitting && uploadProgress[i] === 100 && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-white text-xs font-medium bg-emerald-600/90 px-2 py-0.5 rounded">✓ Linked</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Tips" subtitle="Listings with photos perform 5× better">
            <ul className="text-sm text-noir/60 space-y-2 list-disc list-inside">
              <li>Add at least 5 high-quality photos.</li>
              <li>Set accurate coordinates for the map.</li>
              <li>Save as draft first to preview.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <div className="text-xs font-medium text-noir/60 mb-1.5">{label}</div>
      {children}
    </label>
  );
}