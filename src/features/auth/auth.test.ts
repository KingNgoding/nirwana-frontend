import { Schema } from "effect";
import { describe, expect, it, vi } from "vitest";
import { api } from "../../shared/api/client";
import { ApiError, readResult } from "../../shared/api/result";
import { clearUserSessionCache, queryClient } from "../../shared/query-client";
import { loginSchema, passwordSchema, recoverySchema } from "./schemas";
import { refreshSession } from "./session";

describe("week 1 boundaries", () => {
  it("settles an anonymous me response without cancelling its own query", async () => {
    queryClient.clear();
    queryClient.setQueryData(["private-data"], { name: "previous-user" });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: "UNAUTHENTICATED", message: "ignored" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    );
    expect(await refreshSession()).toBeNull();
    expect(queryClient.getQueryData(["private-data"])).toBeUndefined();
    const request = vi.mocked(fetch).mock.calls.at(-1)?.[0];
    expect(request instanceof Request && request.credentials).toBe("include");
    queryClient.clear();
  });
  it("does not restore a previous user from a late session response after logout", async () => {
    queryClient.clear();
    let finish!: (value: { id: string }) => void;
    const pending = new Promise<{ id: string }>((resolve) => {
      finish = resolve;
    });
    const oldRequest = queryClient
      .fetchQuery({ queryKey: ["session"], queryFn: () => pending })
      .catch(() => null);
    await clearUserSessionCache();
    expect(queryClient.getQueryData(["session"])).toBeNull();
    finish({ id: "previous-user" });
    await oldRequest;
    expect(queryClient.getQueryData(["session"])).toBeNull();
    queryClient.clear();
  });
  it("accepts typed phone formats and preserves password spaces", () => {
    const value = Schema.decodeUnknownSync(loginSchema)({
      phone: "0811 000 001",
      password: "  password  ",
    });
    expect(value.password).toBe("  password  ");
  });
  it("rejects a mismatched confirmation and a calendar-date password", () => {
    expect(() =>
      Schema.decodeUnknownSync(passwordSchema)({
        password: "other-password",
        passwordConfirmation: "different",
      }),
    ).toThrow();
    expect(() =>
      Schema.decodeUnknownSync(passwordSchema)({
        password: "01012000",
        passwordConfirmation: "01012000",
      }),
    ).toThrow();
  });
  it("requires a six digit OTP", () => {
    expect(() =>
      Schema.decodeUnknownSync(recoverySchema)({
        phone: "0811000001",
        otp: "12345",
        password: "new-password",
        passwordConfirmation: "new-password",
      }),
    ).toThrow();
  });
  it("does not expose arbitrary backend messages", () => {
    const error = new ApiError(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "secret request content",
        issues: [{ path: "phone" }],
      },
    });
    expect(error.message).not.toContain("secret");
    expect(error.fields).toEqual(["phone"]);
  });
  it("honours server cooldown and rejects a malformed successful response", () => {
    const error = new ApiError(
      429,
      {
        error: {
          code: "RATE_LIMITED",
          message: "ignored",
          retryAfterSeconds: 90,
        },
      },
      new Headers({ "Retry-After": "120" }),
    );
    expect(error.retryAfterSeconds).toBe(120);
    expect(() =>
      readResult({ response: new Response(null, { status: 200 }) }),
    ).toThrow();
  });
  it("does not clear a valid session for an invalid public OTP", async () => {
    queryClient.setQueryData(["session"], { id: "synthetic" });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { code: "OTP_INVALID", message: "ignored" } }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    );
    await api.POST("/auth/activate", {
      body: {
        phone: "0811000001",
        otp: "123456",
        password: "new-password",
        passwordConfirmation: "new-password",
      },
    });
    expect(queryClient.getQueryData(["session"])).toEqual({ id: "synthetic" });
    queryClient.clear();
  });
});
