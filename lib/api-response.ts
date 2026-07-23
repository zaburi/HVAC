import { ValidationError } from "./database";

export function apiErrorResponse(error: unknown) {
  if (error instanceof ValidationError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          fields: error.field ? { [error.field]: error.message } : {},
          traceId: `req_${crypto.randomUUID()}`,
        },
      },
      {
        status:
          error.code === "NOT_FOUND"
            ? 404
            : error.code === "CONFLICT"
              ? 409
              : 400,
      },
    );
  }
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unexpected error",
        traceId: `req_${crypto.randomUUID()}`,
      },
    },
    { status: 500 },
  );
}
