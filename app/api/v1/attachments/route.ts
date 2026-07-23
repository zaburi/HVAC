import {
  ensureDatabase,
  getRuntimeDatabase,
  getRuntimeFiles,
} from "../../../../lib/database";

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

    const id = `att_${crypto.randomUUID()}`;
    const objectKey = `coolops/${entityType}/${entityId}/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await getRuntimeFiles().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { entityType, entityId, uploadedBy: "Asha Mwita" },
    });
    const database = getRuntimeDatabase();
    await ensureDatabase(database);
    await database
      .prepare(
        `INSERT INTO attachments VALUES (?, 'org_coolops', ?, ?, ?, ?, ?, ?, 'Asha Mwita', ?)`,
      )
      .bind(
        id,
        entityType,
        entityId,
        objectKey,
        file.name,
        file.type,
        file.size,
        new Date().toISOString(),
      )
      .run();

    return Response.json(
      { attachment: { id, filename: file.name, contentType: file.type, size: file.size } },
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
