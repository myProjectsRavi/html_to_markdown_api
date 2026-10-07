import { readFile } from "node:fs/promises";
import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";
import { ENDPOINTS, LIMITS, VALIDATION_PRECEDENCE } from "../src/config";
import { ERROR_DEFINITIONS } from "../src/errors";
import { conversionResponse } from "../src/routes/conversion";
import { healthResponse } from "../src/routes/health";

type Api = Record<string, any>;

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function scalarCount(value: string): number {
  return Array.from(value).length;
}

function runtimeErrorCatalog() {
  return Object.fromEntries(
    Object.entries(ERROR_DEFINITIONS).map(([code, definition]) => [
      code,
      { status: definition.status, message: definition.message },
    ]),
  );
}

async function loadSpec(): Promise<Api> {
  return await SwaggerParser.validate("openapi.yaml") as unknown as Api;
}

describe("US037 OpenAPI contract", () => {
  it("passes an OpenAPI 3.0 validator", async () => {
    const api = await loadSpec();
    expect(api.openapi).toBe("3.0.3");
    expect(api.info.version).toBe("1.0.0");
  });

  it("matches runtime routes, limits, precedence and fixed errors", async () => {
    const api = await loadSpec();
    const raw = await readFile("openapi.yaml", "utf8");

    expect(Object.keys(api.paths).sort()).toEqual(
      [ENDPOINTS.health, ENDPOINTS.markdown, ENDPOINTS.text].sort(),
    );
    expect(Object.keys(api.paths[ENDPOINTS.health]).filter((key) => key === "get")).toEqual(["get"]);
    expect(Object.keys(api.paths[ENDPOINTS.markdown]).filter((key) => key === "post")).toEqual(["post"]);
    expect(Object.keys(api.paths[ENDPOINTS.text]).filter((key) => key === "post")).toEqual(["post"]);

    expect(api["x-limits"]).toEqual({
      raw_json_body_bytes: LIMITS.rawJsonBodyBytes,
      decoded_html_bytes: LIMITS.decodedHtmlBytes,
      tokenizer_events: LIMITS.tokenizerEvents,
      retained_nodes: LIMITS.retainedNodes,
      open_element_depth: LIMITS.openElementDepth,
      attributes_per_element: LIMITS.attributesPerElement,
      attribute_name_scalars: LIMITS.attributeNameScalars,
      attribute_value_bytes: LIMITS.attributeValueBytes,
      url_bytes: LIMITS.urlBytes,
      table_rows: LIMITS.tableRows,
      table_cells_per_row: LIMITS.tableCellsPerRow,
      table_cells_per_table: LIMITS.tableCellsPerTable,
      output_scalars: LIMITS.outputScalars,
      output_bytes: LIMITS.outputBytes,
    });
    expect(api["x-validation-precedence"]).toEqual([...VALIDATION_PRECEDENCE]);
    expect(api["x-error-catalog"]).toEqual(runtimeErrorCatalog());

    expect(api.components.schemas.ConversionRequest.additionalProperties).toBe(false);
    expect(Object.keys(api.components.schemas.ConversionRequest.properties)).toEqual(["html"]);
    expect(api.components.securitySchemes.RapidApiSubscriptionKey.name).toBe("X-RapidAPI-Key");
    expect(api["x-rapidapi-client-auth"]).toMatchObject({
      subscription_header: "X-RapidAPI-Key",
      routing_header: "X-RapidAPI-Host",
      private_origin_credential_exposed: false,
    });
    expect(Object.keys(api.paths).join("\n").toLowerCase()).not.toContain("url");
    expect(raw).not.toContain("proxy-secret");

    const codes = ["200", "400", "403", "413", "415", "422", "500", "503"];
    expect(Object.keys(api.paths[ENDPOINTS.markdown].post.responses).sort()).toEqual(codes);
    expect(Object.keys(api.paths[ENDPOINTS.text].post.responses).sort()).toEqual(codes);
  });

  it("executes the documented success examples with factual counts", async () => {
    const api = await loadSpec();
    const markdownRequest = api.paths[ENDPOINTS.markdown].post.requestBody.content["application/json"].example;
    const textRequest = api.paths[ENDPOINTS.text].post.requestBody.content["application/json"].example;
    const markdownExample = api.components.responses.MarkdownSuccess.content["application/json"].example;
    const textExample = api.components.responses.TextSuccess.content["application/json"].example;

    expect(markdownRequest).toEqual(textRequest);
    expect(utf8Bytes(markdownRequest.html)).toBe(markdownExample.stats.input_bytes);
    expect(utf8Bytes(textRequest.html)).toBe(textExample.stats.input_bytes);
    expect(scalarCount(markdownExample.markdown)).toBe(markdownExample.stats.output_chars);
    expect(scalarCount(textExample.text)).toBe(textExample.stats.output_chars);

    expect(await healthResponse().json()).toEqual(
      api.paths[ENDPOINTS.health].get.responses["200"].content["application/json"].example,
    );

    const markdown = conversionResponse(
      ENDPOINTS.markdown,
      markdownRequest.html,
      utf8Bytes(markdownRequest.html),
    );
    expect(await markdown.json()).toEqual(markdownExample);

    const text = conversionResponse(
      ENDPOINTS.text,
      textRequest.html,
      utf8Bytes(textRequest.html),
    );
    expect(await text.json()).toEqual(textExample);
  });

  it("describes router-only 404 and 405 behavior separately from conversion responses", async () => {
    const api = await loadSpec();
    expect(api["x-router-errors"]).toEqual({
      unknown_path: { status: 404, code: "not_found" },
      unsupported_method: { status: 405, code: "method_not_allowed", allow_header: true },
    });
    expect(api.components.responses.NotFound.content["application/json"].example.error.code).toBe("not_found");
    expect(api.components.responses.MethodNotAllowedPost.headers.Allow.schema.enum).toEqual(["POST"]);
    expect(api.components.responses.MethodNotAllowedGet.headers.Allow.schema.enum).toEqual(["GET"]);
  });
});
