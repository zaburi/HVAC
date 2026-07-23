const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const entityType = String(form.get("entityType") ?? "").trim();
    const entityId = String(form.get("entityId") ?? "").trim();
    if (!(file instanceof File) || !entityType || !entityId) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "File and record are required." } },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: { code: "INVALID_FILE", message: "Use a JPG, PNG, WebP or PDF up to 10 MB." } },
        { status: 400 },
      );
    }

    return Response.json(
      {
        attachment: {
          id: `demo_att_${crypto.randomUUID()}`,
          entityType,
          entityId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          demo: true,
          retained: false,
        },
        message: "Demo preview only. The selected file was not uploaded or retained.",
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error: {
          code: "UPLOAD_FAILED",
          message: error instanceof Error ? error.message : "Upload failed",
        },
      },
      { status: 500 },
    );
  }
}
