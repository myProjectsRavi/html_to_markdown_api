import { describe, expect, it, vi } from "vitest";
import {
  MAX_RAW_BODY_BYTES,
  readBoundedJsonBody,
} from "../src/http/body";

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function requestFromStream(
  stream: ReadableStream<Uint8Array>,
  headers: HeadersInit = {},
): Request {
  const normalized = new Headers(headers);
  if (!normalized.has("Content-Type")) {
    normalized.set("Content-Type", "application/json");
  }
  return new Request("https://example.test/v1/html/markdown", {
    method: "POST",
    headers: normalized,
    body: stream,
  });
}

function chunkStream(
  chunks: readonly Uint8Array[],
  options: { failAfterChunks?: number; onCancel?: () => void } = {},
): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (
        options.failAfterChunks !== undefined &&
        index >= options.failAfterChunks
      ) {
        controller.error(new Error("synthetic early disconnect"));
        return;
      }

      if (index >= chunks.length) {
        controller.close();
        return;
      }

      controller.enqueue(chunks[index++]!);
    },
    cancel() {
      options.onCancel?.();
    },
  }, { highWaterMark: 0 });
}

async function expectError(
  result: Awaited<ReturnType<typeof readBoundedJsonBody>>,
  status: number,
  code: string,
): Promise<void> {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.response.status).toBe(status);
  const value = (await result.response.json()) as {
    error?: { code?: string };
  };
  expect(value.error?.code).toBe(code);
}

describe("US007 bounded request bodies", () => {
  it("admits exactly 800000 raw bytes with bounded retained allocation", async () => {
    const chunk = new Uint8Array(MAX_RAW_BODY_BYTES).fill(0x61);
    const result = await readBoundedJsonBody(
      requestFromStream(chunkStream([chunk])),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bytes).toBe(800_000);
    expect(result.bytes).toBeLessThanOrEqual(MAX_RAW_BODY_BYTES);
    expect(result.text.length).toBe(800_000);
  });

  it("rejects one actual byte over the cap and cancels the reader", async () => {
    let cancelled = false;
    const chunks = [
      new Uint8Array(MAX_RAW_BODY_BYTES).fill(0x61),
      new Uint8Array([0x62]),
    ];
    const result = await readBoundedJsonBody(
      requestFromStream(
        chunkStream(chunks, {
          onCancel: () => {
            cancelled = true;
          },
        }),
      ),
    );

    await expectError(result, 413, "input_too_large");
    expect(cancelled).toBe(true);
  });

  it("rejects one oversized chunk before retaining it", async () => {
    let cancelled = false;
    const result = await readBoundedJsonBody(
      requestFromStream(
        chunkStream([new Uint8Array(MAX_RAW_BODY_BYTES + 1)], {
          onCancel: () => {
            cancelled = true;
          },
        }),
      ),
    );

    await expectError(result, 413, "input_too_large");
    expect(cancelled).toBe(true);
  });

  it("uses Content-Length only as an early rejection and still counts actual bytes", async () => {
    const early = await readBoundedJsonBody(
      requestFromStream(chunkStream([bytes("x")]), {
        "Content-Length": String(MAX_RAW_BODY_BYTES + 1),
      }),
    );
    await expectError(early, 413, "input_too_large");

    for (const declared of [undefined, "1", "not-a-number"] as const) {
      let cancelled = false;
      const headers = new Headers();
      if (declared !== undefined) headers.set("Content-Length", declared);

      const result = await readBoundedJsonBody(
        requestFromStream(
          chunkStream([new Uint8Array(MAX_RAW_BODY_BYTES + 1)], {
            onCancel: () => {
              cancelled = true;
            },
          }),
          headers,
        ),
      );
      await expectError(result, 413, "input_too_large");
      expect(cancelled).toBe(true);
    }
  });

  it("accepts application/json with optional UTF-8 charset and rejects unsupported media/encoding", async () => {
    for (const contentType of [
      "application/json",
      "application/json; charset=utf-8",
      'Application/JSON; Charset="UTF-8"',
    ]) {
      const result = await readBoundedJsonBody(
        requestFromStream(chunkStream([bytes("{}")]), {
          "Content-Type": contentType,
          "Content-Encoding": "identity",
        }),
      );
      expect(result.ok).toBe(true);
    }

    const unsupportedHeaders: readonly HeadersInit[] = [
      { "Content-Type": "text/plain" },
      { "Content-Type": "application/json; charset=iso-8859-1" },
      {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
      },
    ];

    for (const headers of unsupportedHeaders) {
      const result = await readBoundedJsonBody(
        requestFromStream(chunkStream([bytes("{}")]), headers),
      );
      await expectError(result, 415, "unsupported_media_type");
    }
  });

  it("decodes a multibyte UTF-8 scalar split across one-byte chunks", async () => {
    const encoded = bytes("😀");
    const result = await readBoundedJsonBody(
      requestFromStream(
        chunkStream(Array.from(encoded, (value) => new Uint8Array([value]))),
      ),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bytes).toBe(4);
    expect(result.text).toBe("😀");
  });

  it("rejects invalid UTF-8 with the fixed 400 error", async () => {
    const result = await readBoundedJsonBody(
      requestFromStream(
        chunkStream([new Uint8Array([0xc3]), new Uint8Array([0x28])]),
      ),
    );

    await expectError(result, 400, "invalid_json");
  });

  it("maps an early stream disconnect to the fixed 400 error", async () => {
    const result = await readBoundedJsonBody(
      requestFromStream(
        chunkStream([bytes("{")], { failAfterChunks: 1 }),
      ),
    );

    await expectError(result, 400, "invalid_json");
  });

  it("never writes body text to console logs", async () => {
    const canary = "synthetic-body-canary-must-not-log";
    const methods = ["log", "info", "warn", "error"] as const;
    const spies = methods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );

    try {
      const result = await readBoundedJsonBody(
        requestFromStream(chunkStream([bytes(canary)])),
      );
      expect(result.ok).toBe(true);

      const rendered = spies
        .flatMap((spy) => spy.mock.calls)
        .flat()
        .map(String)
        .join("\n");
      expect(rendered).not.toContain(canary);
      expect(rendered).toBe("");
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});
