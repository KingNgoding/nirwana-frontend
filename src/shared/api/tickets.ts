import { Schema } from "effect";
import { api } from "./client";

const text = (max: number) =>
  Schema.String.pipe(Schema.minLength(1), Schema.maxLength(max));
const photo = Schema.instanceOf(File).pipe(
  Schema.filter(
    (file) =>
      ["image/jpeg", "image/png"].includes(file.type) &&
      file.size <= 5 * 1024 * 1024,
  ),
);

export const ticketSubmissionSchema = Schema.Struct({
  serviceNumber: Schema.String.pipe(Schema.pattern(/^[A-Za-z0-9._/-]{1,40}$/)),
  route: Schema.Literal("form", "ai"),
  complaint: text(4000),
  title: text(150),
  description: text(4000),
  categoryId: Schema.optional(text(64)),
  photos: Schema.optional(Schema.Array(photo).pipe(Schema.maxItems(5))),
});
export type TicketSubmission = typeof ticketSubmissionSchema.Type;

export function serializeTicketSubmission(input: TicketSubmission): FormData {
  const validated = Schema.decodeUnknownSync(ticketSubmissionSchema)(input);
  const body = new FormData();
  for (const field of [
    "serviceNumber",
    "route",
    "complaint",
    "title",
    "description",
  ] as const)
    body.append(field, validated[field]);
  if (validated.categoryId) body.append("categoryId", validated.categoryId);
  for (const file of validated.photos ?? []) body.append("photos", file);
  return body;
}

// Caller owns one stable key and the same payload until the outcome is known.
// Draft endpoint: 501 is expected until NMS-28 is implemented.
export function submitTicket(input: TicketSubmission, idempotencyKey: string) {
  if (idempotencyKey.length < 16 || idempotencyKey.length > 64)
    throw new Error("Invalid Idempotency-Key length");
  const body = serializeTicketSubmission(input);
  return api.POST("/tickets", {
    params: { header: { "idempotency-key": idempotencyKey } },
    body: {
      serviceNumber: input.serviceNumber,
      route: input.route,
      complaint: input.complaint,
      title: input.title,
      description: input.description,
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    },
    bodySerializer: () => body,
  });
}
