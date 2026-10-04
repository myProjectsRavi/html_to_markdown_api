export type ErrorStatus =
  | 400
  | 403
  | 404
  | 405
  | 413
  | 415
  | 422
  | 500
  | 503;

export const ERROR_DEFINITIONS = {
  invalid_json: {
    status: 400,
    message: "Request body must be valid UTF-8 JSON.",
  },
  missing_html: {
    status: 400,
    message: "The html property is required.",
  },
  invalid_request: {
    status: 400,
    message: "Request does not match the supported schema.",
  },
  forbidden: {
    status: 403,
    message: "Request is not authorized.",
  },
  not_found: {
    status: 404,
    message: "Resource not found.",
  },
  method_not_allowed: {
    status: 405,
    message: "Method not allowed.",
  },
  input_too_large: {
    status: 413,
    message: "Input exceeds the supported limit.",
  },
  unsupported_media_type: {
    status: 415,
    message: "Request media type or encoding is not supported.",
  },
  input_too_complex: {
    status: 422,
    message: "Input exceeds the supported complexity limit.",
  },
  output_too_large: {
    status: 422,
    message: "Output exceeds the supported limit.",
  },
  internal_error: {
    status: 500,
    message: "An internal error occurred.",
  },
  service_unavailable: {
    status: 503,
    message: "Service configuration is unavailable.",
  },
} as const satisfies Record<
  string,
  { readonly status: ErrorStatus; readonly message: string }
>;

export type ErrorCode = keyof typeof ERROR_DEFINITIONS;

export type ErrorEnvelope<C extends ErrorCode = ErrorCode> = {
  readonly error: {
    readonly code: C;
    readonly message: (typeof ERROR_DEFINITIONS)[C]["message"];
  };
};
