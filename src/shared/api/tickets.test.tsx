import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Schema } from "effect";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import {
  serializeTicketSubmission,
  submitTicket,
  type TicketSubmission,
} from "./tickets";

const input: TicketSubmission = {
  serviceNumber: "DEMO-001",
  route: "form",
  complaint: "Keluhan sintetis asli",
  title: "Contoh sintetis",
  description: "Deskripsi sintetis terpisah",
};

describe("contract adapter", () => {
  it("keeps original complaint separate and sends actual repeated photo files", () => {
    const files = [
      new File(["synthetic"], "demo.png", { type: "image/png" }),
      new File(["synthetic"], "demo.jpg", { type: "image/jpeg" }),
    ];
    const body = serializeTicketSubmission({ ...input, photos: files });
    expect(body.get("complaint")).toBe(input.complaint);
    expect(body.get("description")).toBe(input.description);
    expect(body.getAll("photos")).toEqual(files);
    expect(body.has("categoryId")).toBe(false);
  });
  it.each([
    { title: "x".repeat(151) },
    { complaint: "x".repeat(4001) },
    { description: "" },
    { serviceNumber: "invalid number" },
    {
      photos: Array.from(
        { length: 6 },
        () => new File(["demo"], "demo.png", { type: "image/png" }),
      ),
    },
    {
      photos: [
        new File(["demo"], "demo.exe", { type: "application/octet-stream" }),
      ],
    },
    {
      photos: [
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
      ],
    },
  ])("rejects invalid payload %#", (invalid) => {
    expect(() => serializeTicketSubmission({ ...input, ...invalid })).toThrow();
  });
  it("accepts exact field and photo limits", () => {
    expect(() =>
      serializeTicketSubmission({
        ...input,
        title: "x".repeat(150),
        complaint: "x".repeat(4000),
        description: "x".repeat(4000),
        photos: [
          new File([new Uint8Array(5 * 1024 * 1024)], "max.png", {
            type: "image/png",
          }),
        ],
      }),
    ).not.toThrow();
  });
  it("retains cookies and caller key without automatic mutation retry", async () => {
    const requests: Request[] = [];
    vi.mocked(fetch).mockImplementation(async (request) => {
      if (!(request instanceof Request)) throw new Error("Expected a Request");
      requests.push(request);
      return new Response(
        JSON.stringify({
          error: { code: "NOT_IMPLEMENTED", message: "Belum tersedia." },
        }),
        { status: 501, headers: { "Content-Type": "application/json" } },
      );
    });
    const key = "synthetic-stable-key-0001";
    await submitTicket(input, key);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.credentials).toBe("include");
    expect(requests[0]?.headers.get("Idempotency-Key")).toBe(key);
    expect(requests[0]?.headers.get("Content-Type")).toContain(
      "multipart/form-data; boundary=",
    );
  });
});

const schema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
});
function FormProbe({
  submitted,
}: {
  submitted: (data: typeof schema.Type) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<typeof schema.Type>({ resolver: effectTsResolver(schema) });
  return (
    <form onSubmit={handleSubmit(submitted)}>
      <label>
        Tes judul
        <input {...register("title")} />
      </label>
      {errors.title && <span role="alert">Judul wajib diisi</span>}
      <button type="submit">Uji</button>
    </form>
  );
}
it("official RHF resolver validates Effect 3 schema and submits decoded values", async () => {
  const submitted = vi.fn();
  render(<FormProbe submitted={submitted} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Uji" }));
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(submitted).not.toHaveBeenCalled();
  await user.type(
    screen.getByRole("textbox", { name: "Tes judul" }),
    "Data sintetis",
  );
  await user.click(screen.getByRole("button", { name: "Uji" }));
  expect(submitted.mock.calls[0]?.[0]).toEqual({ title: "Data sintetis" });
});
