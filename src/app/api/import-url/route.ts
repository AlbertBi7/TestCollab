import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ReferenceType } from "@/lib/fileType";

const STORAGE_BUCKET = "Link-UpWorkpace";

// Create a Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { url, type } = await request.json() as { url: string; type: ReferenceType };

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Get authorization header if present
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Create supabase client (use service key for storage operations)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user if token provided
    let userId: string | null = null;
    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Fetch the file from the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const blob = await response.blob();

    // Generate filename from URL
    let fileName = "imported_file";
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes(".")) {
        fileName = decodeURIComponent(lastPart);
      } else {
        // Generate extension from content type
        const extMap: Record<string, string> = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/gif": ".gif",
          "image/webp": ".webp",
          "video/mp4": ".mp4",
          "video/webm": ".webm",
          "audio/mpeg": ".mp3",
          "audio/wav": ".wav",
          "application/pdf": ".pdf",
        };
        const ext = extMap[contentType] || "";
        fileName = `imported_${Date.now()}${ext}`;
      }
    } catch {
      fileName = `imported_${Date.now()}`;
    }

    // Build storage path
    const storagePath = `imports/${type}/${Date.now()}_${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, blob, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      publicUrl: urlData.publicUrl,
      fileName,
      type,
      contentType,
    });
  } catch (error: any) {
    console.error("Import URL error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import file" },
      { status: 500 }
    );
  }
}
