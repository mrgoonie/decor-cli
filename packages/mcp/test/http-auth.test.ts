import { describe, expect, it } from "vitest";
import { authorizeHttp } from "../src/auth/http-auth.js";
import { IncomingMessage, ServerResponse } from "node:http";

function fakeReq(headers: Record<string, string | undefined>, method = "GET"): IncomingMessage {
  return { headers, method } as IncomingMessage;
}

function fakeRes() {
  const state = { status: 0 };
  return {
    writeHead(status: number) {
      state.status = status;
      return state;
    },
    end() {
      return state;
    },
    state
  } as unknown as ServerResponse & { state: { status: number } };
}

describe("HTTP auth", () => {
  it("rejects missing bearer token before parsing", () => {
    const res = fakeRes();
    const ok = authorizeHttp(fakeReq({}), res, { token: "secret", allowedOrigins: [], maxBodyBytes: 1000 });
    expect(ok).toBe(false);
    expect(res.state.status).toBe(401);
  });

  it("rejects forbidden origins", () => {
    const res = fakeRes();
    const ok = authorizeHttp(fakeReq({ authorization: "Bearer secret", origin: "https://bad.test" }), res, {
      token: "secret",
      allowedOrigins: ["https://good.test"],
      maxBodyBytes: 1000
    });
    expect(ok).toBe(false);
    expect(res.state.status).toBe(403);
  });

  it("rejects browser origins unless explicitly configured", () => {
    const res = fakeRes();
    const ok = authorizeHttp(fakeReq({ authorization: "Bearer secret", origin: "https://site.test" }), res, {
      token: "secret",
      allowedOrigins: [],
      maxBodyBytes: 1000
    });
    expect(ok).toBe(false);
    expect(res.state.status).toBe(403);
  });

  it("allows absent origin after bearer auth", () => {
    const res = fakeRes();
    const ok = authorizeHttp(fakeReq({ authorization: "Bearer secret" }), res, {
      token: "secret",
      allowedOrigins: [],
      maxBodyBytes: 1000
    });
    expect(ok).toBe(true);
    expect(res.state.status).toBe(0);
  });

  it("requires and caps Content-Length for body requests", () => {
    const missing = fakeRes();
    expect(authorizeHttp(fakeReq({ authorization: "Bearer secret" }, "POST"), missing, {
      token: "secret",
      allowedOrigins: [],
      maxBodyBytes: 1000
    })).toBe(false);
    expect(missing.state.status).toBe(411);

    const tooLarge = fakeRes();
    expect(authorizeHttp(fakeReq({ authorization: "Bearer secret", "content-length": "1001" }, "POST"), tooLarge, {
      token: "secret",
      allowedOrigins: [],
      maxBodyBytes: 1000
    })).toBe(false);
    expect(tooLarge.state.status).toBe(413);
  });
});
