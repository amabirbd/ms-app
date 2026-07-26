import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { id?: string }>();
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      error instanceof HttpException ? error.getResponse() : undefined;
    const structured =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};
    const detail =
      typeof structured.detail === "string"
        ? structured.detail
        : status === 500
          ? "An unexpected error occurred"
          : error instanceof Error
            ? error.message
            : String(body ?? "Request failed");

    response
      .status(status)
      .type("application/problem+json")
      .json({
        type: `https://docs.example.com/problems/${status}`,
        title: HttpStatus[status] ?? "Error",
        status,
        detail,
        instance: request.originalUrl,
        requestId: request.id ?? "unknown",
        ...(structured.violations ? { violations: structured.violations } : {}),
      });
  }
}
