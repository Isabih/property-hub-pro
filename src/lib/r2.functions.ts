import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AwsClient } from "aws4fetch";

const BUCKET = process.env.R2_BUCKET || "uploads";

export const signR2Upload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; contentType: string }) => d)
  .handler(async ({ data, context }) => {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKey = process.env.R2_ACCESS_KEY_ID;
    const secretKey = process.env.R2_SECRET_ACCESS_KEY;
    const publicBase = process.env.R2_PUBLIC_BASE_URL;
    if (!accountId || !accessKey || !secretKey || !publicBase) {
      throw new Error("R2 not configured");
    }
    // Only IT/admin may upload property media via R2
    const { data: isIt } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "it" as any });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" as any });
    if (!isIt && !isAdmin) throw new Error("Forbidden");

    const safeKey = data.key.replace(/^\/+/, "");
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${BUCKET}/${safeKey}`;
    const client = new AwsClient({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      service: "s3",
      region: "auto",
    });
    const signed = await client.sign(
      new Request(`${endpoint}?X-Amz-Expires=3600`, {
        method: "PUT",
        headers: { "content-type": data.contentType || "application/octet-stream" },
      }),
      { aws: { signQuery: true } },
    );
    return {
      uploadUrl: signed.url,
      publicUrl: `${publicBase.replace(/\/+$/, "")}/${safeKey}`,
      key: safeKey,
    };
  });