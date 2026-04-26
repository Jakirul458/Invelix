import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { businessSchema, type BusinessFormValues } from "@/lib/schemas";
import { SignaturePad } from "@/components/settings/SignaturePad";
import { FileUpload } from "@/components/settings/FileUpload";

async function signedUrl(path: string | null, bucket: "signatures" | "logos") {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export default function Settings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sigPath, setSigPath] = useState<string | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      business_name: "", address: "", city: "", state: "",
      postal_code: "", phone: "", gst_number: "", pan_number: "",
      bank_holder: "", bank_name: "", bank_account: "", bank_branch: "", bank_ifsc: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("owners").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        form.reset({
          business_name: data.business_name ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          postal_code: data.postal_code ?? "",
          phone: data.phone ?? "",
          gst_number: data.gst_number ?? "",
          pan_number: data.pan_number ?? "",
          bank_holder: (data as any).bank_holder ?? "",
          bank_name: (data as any).bank_name ?? "",
          bank_account: (data as any).bank_account ?? "",
          bank_branch: (data as any).bank_branch ?? "",
          bank_ifsc: (data as any).bank_ifsc ?? "",
        });
        setLogoPath(data.logo_url);
        setSigPath(data.signature_url);
        const [lu, su] = await Promise.all([
          signedUrl(data.logo_url, "logos"),
          signedUrl(data.signature_url, "signatures"),
        ]);
        setLogoUrl(lu);
        setSigUrl(su);
      }
      setLoading(false);
    })();
  }, [user, form]);

  const onSubmit = async (values: BusinessFormValues) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("owners").update(values).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Settings saved" });
  };

  const uploadFile = async (
    bucket: "logos" | "signatures",
    file: Blob,
    ext: string,
  ) => {
    if (!user) return null;
    const path = `${user.id}/${bucket === "logos" ? "logo" : "signature"}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || "image/png",
      upsert: true,
    });
    if (error) throw error;
    const update = bucket === "logos" ? { logo_url: path } : { signature_url: path };
    const { error: e2 } = await supabase.from("owners").update(update).eq("id", user.id);
    if (e2) throw e2;
    const url = await signedUrl(path, bucket);
    return { path, url };
  };

  const removeFile = async (bucket: "logos" | "signatures") => {
    if (!user) return;
    const path = bucket === "logos" ? logoPath : sigPath;
    if (path) await supabase.storage.from(bucket).remove([path]);
    const update = bucket === "logos" ? { logo_url: null } : { signature_url: null };
    await supabase.from("owners").update(update).eq("id", user.id);
    if (bucket === "logos") { setLogoPath(null); setLogoUrl(null); }
    else { setSigPath(null); setSigUrl(null); }
    toast({ title: "Removed" });
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Business settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          These details appear on every invoice you create.
        </p>
      </div>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business details</TabsTrigger>
          <TabsTrigger value="bank">Bank details</TabsTrigger>
          <TabsTrigger value="branding">Logo &amp; signature</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business name</Label>
                <Input id="business_name" {...form.register("business_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={2} {...form.register("address")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" {...form.register("city")} /></div>
                <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" {...form.register("state")} /></div>
                <div className="space-y-2"><Label htmlFor="postal_code">Postal code</Label><Input id="postal_code" {...form.register("postal_code")} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" {...form.register("phone")} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="gst_number">GST number</Label><Input id="gst_number" {...form.register("gst_number")} /></div>
                <div className="space-y-2"><Label htmlFor="pan_number">PAN number</Label><Input id="pan_number" {...form.register("pan_number")} /></div>
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-medium">Bank account details</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Shown in the &quot;Company&apos;s Bank Details&quot; section on every invoice.
              </p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_holder">Account holder name</Label>
                  <Input id="bank_holder" placeholder="As per bank records" {...form.register("bank_holder")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank name</Label>
                  <Input id="bank_name" placeholder="e.g. HDFC Bank" {...form.register("bank_name")} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Account number</Label>
                  <Input id="bank_account" inputMode="numeric" {...form.register("bank_account")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_ifsc">IFSC code</Label>
                  <Input id="bank_ifsc" placeholder="e.g. HDFC0001234" className="uppercase" {...form.register("bank_ifsc")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_branch">Branch</Label>
                <Input id="bank_branch" placeholder="Branch name & city" {...form.register("bank_branch")} />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save bank details
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-4">
              <div>
                <h3 className="font-medium">Logo</h3>
                <p className="text-xs text-muted-foreground mt-1">PNG/JPG, max 2MB. Shown on top-left of invoices.</p>
              </div>
              {logoUrl ? (
                <div className="rounded-lg border bg-muted/30 p-4 grid place-items-center">
                  <img src={logoUrl} alt="Logo" className="h-24 object-contain" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">No logo uploaded</div>
              )}
              <div className="flex items-center gap-2">
                <FileUpload
                  uploading={uploadingLogo}
                  label={logoUrl ? "Replace logo" : "Upload logo"}
                  onUpload={async (f) => {
                    setUploadingLogo(true);
                    try {
                      const ext = f.name.split(".").pop() || "png";
                      const r = await uploadFile("logos", f, ext);
                      if (r) { setLogoPath(r.path); setLogoUrl(r.url); toast({ title: "Logo updated" }); }
                    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
                    finally { setUploadingLogo(false); }
                  }}
                />
                {logoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => removeFile("logos")}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div>
                <h3 className="font-medium">Signature</h3>
                <p className="text-xs text-muted-foreground mt-1">Draw or upload. Shown at bottom-right of invoices.</p>
              </div>
              {sigUrl ? (
                <div className="rounded-lg border bg-white p-4 grid place-items-center">
                  <img src={sigUrl} alt="Signature" className="h-20 object-contain" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">No signature saved</div>
              )}
              <div className="flex items-center gap-2">
                <FileUpload
                  uploading={uploadingSig}
                  label={sigUrl ? "Upload new" : "Upload image"}
                  onUpload={async (f) => {
                    setUploadingSig(true);
                    try {
                      const ext = f.name.split(".").pop() || "png";
                      const r = await uploadFile("signatures", f, ext);
                      if (r) { setSigPath(r.path); setSigUrl(r.url); toast({ title: "Signature updated" }); }
                    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
                    finally { setUploadingSig(false); }
                  }}
                />
                {sigUrl && (
                  <Button variant="ghost" size="sm" onClick={() => removeFile("signatures")}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="text-xs text-muted-foreground mb-2">Or draw with mouse / touch:</div>
                <SignaturePad
                  saving={uploadingSig}
                  onSave={async (blob) => {
                    setUploadingSig(true);
                    try {
                      const r = await uploadFile("signatures", blob, "png");
                      if (r) { setSigPath(r.path); setSigUrl(r.url); toast({ title: "Signature saved" }); }
                    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
                    finally { setUploadingSig(false); }
                  }}
                />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
