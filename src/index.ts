const bootstrapResponse = {
  error: {
    code: "not_implemented",
    message: "Conversion routes are not implemented yet.",
  },
} as const;

export default {
  fetch(_request: Request): Response {
    return Response.json(bootstrapResponse, { status: 501 });
  },
};
