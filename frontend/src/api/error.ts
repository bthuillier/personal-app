export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const defaultMessages: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "You are not authenticated. Please log in.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current state.",
  422: "The submitted data is invalid.",
  429: "Too many requests. Please try again later.",
  500: "Something went wrong on the server.",
  502: "The server is temporarily unavailable.",
  503: "The service is temporarily unavailable.",
};

export function getErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object" && "message" in body && typeof (body as { message: unknown }).message === "string") {
    return (body as { message: string }).message;
  }
  if (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return defaultMessages[status] ?? `Request failed (${status})`;
}
