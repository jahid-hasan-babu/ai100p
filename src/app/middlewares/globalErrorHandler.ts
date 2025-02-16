import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import AppError from "../errors/ApiError";
import handleZodError from '../errors/handleZodError';

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err);
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorDetails: Record<string, any> = {};

  if (err instanceof ZodError) {
    // Handle Zod error
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode || 400;
    message = simplifiedError?.message || 'Validation error';
    errorDetails = simplifiedError?.errorDetails || {};
  } else if (err?.code === 'P2002') {
    // Handle Prisma Duplicate entity error
    statusCode = 409;
    message = `Duplicate entity on the fields: ${err.meta?.target?.join(', ')}`;
    errorDetails = { code: err.code, target: err.meta?.target };
  } else if (err?.code === 'P2003') {
    // Handle Prisma Foreign Key constraint error
    statusCode = 400;
    message = `Foreign key constraint failed on the field: ${err.meta?.field_name}`;
    errorDetails = {
      code: err.code,
      field: err.meta?.field_name,
      model: err.meta?.modelName,
    };
  } else if (err?.code === 'P2011') {
    // Handle Prisma Null constraint violation error
    statusCode = 400;
    message = `Null constraint violation on the field: ${err.meta?.field_name}`;
    errorDetails = { code: err.code, field: err.meta?.field_name };
  } else if (err?.code === 'P2025') {
    // Handle Prisma Record not found error
    statusCode = 404;
    message = `Record not found: ${
      err.meta?.cause || 'No matching record found for the given criteria.'
    }`;
    errorDetails = { code: err.code, cause: err.meta?.cause };
  } else if (err instanceof PrismaClientValidationError) {
    // Handle Prisma Validation errors
    statusCode = 400;
    message = 'Validation error in Prisma operation';
    errorDetails = { message: err.message };
  } else if (err instanceof PrismaClientKnownRequestError) {
    // Handle specific Prisma known errors
    statusCode = 400;
    message = err.message;
    errorDetails = { code: err.code, meta: err.meta };
  } else if (err instanceof PrismaClientUnknownRequestError) {
    // Handle Prisma unknown errors
    statusCode = 500;
    message = err.message;
    errorDetails = err;
  } else if (err instanceof AppError) {
    // Handle custom AppError
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = { stack: err.stack };
  } else if (err instanceof Error) {
    // Handle generic Error
    message = err.message;
    errorDetails = { stack: err.stack };
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};
/*
const GlobalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: any = httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Something went wrong!';
  let errorSources = [];
  let errorDetails = err || null;

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err.name === 'TokenExpiredError') {
    message = err.message;
    errorSources = err;
  }
  // Handle Custom ApiError
  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ type: 'ApiError', details: err.message }];
  }
  // handle prisma client validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = parsePrismaValidationError(err.message);
    errorSources.push('Prisma Client Validation Error');
  }
  // Prisma Client Initialization Error
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      'Failed to initialize Prisma Client. Check your database connection or Prisma configuration.';
    errorSources.push('Prisma Client Initialization Error');
  }
  // Prisma Client Rust Panic Error
  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      'A critical error occurred in the Prisma engine. Please try again later.';
    errorSources.push('Prisma Client Rust Panic Error');
  }
  // Prisma Client Unknown Request Error
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'An unknown error occurred while processing the request.';
    errorSources.push('Prisma Client Unknown Request Error');
  }
  // Generic Error Handling (e.g., JavaScript Errors)
  else if (err instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Syntax error in the request. Please verify your input.';
    errorSources.push('Syntax Error');
  } else if (err instanceof TypeError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Type error in the application. Please verify your input.';
    errorSources.push('Type Error');
  } else if (err instanceof ReferenceError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Reference error in the application. Please verify your input.';
    errorSources.push('Reference Error');
  }
  // Catch any other error type
  else {
    message = 'An unexpected error occurred!';
    errorSources.push('Unknown Error');
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err,
    stack: config.NODE_ENV === 'development' ? err?.stack : null,
  });
};
*/
export default globalErrorHandler;
