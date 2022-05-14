import { HttpException, HttpStatus } from '@nestjs/common';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime';

export function isPrismaError(error: Error) {
  return (
    error instanceof PrismaClientKnownRequestError ||
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientRustPanicError ||
    error instanceof PrismaClientInitializationError ||
    error instanceof PrismaClientValidationError
  );
}

export function UnauthorizedError(message = 'Request is not authorized.') {
  const err = new HttpException(
    { code: 'Unauthorized', message },
    HttpStatus.UNAUTHORIZED,
  );
  return err;
}

export function BadRequestError(
  message = 'Request payload is in invalid format.',
) {
  const err = new HttpException(
    { code: 'BadRequest', message },
    HttpStatus.BAD_REQUEST,
  );
  return err;
}

export function ConflictRequestError(
  message = 'The same resource already exists.',
) {
  const err = new HttpException(
    { code: 'Conflict', message },
    HttpStatus.CONFLICT,
  );
  return err;
}

export function NotFoundError(message = 'Resource is not found.') {
  const err = new HttpException(
    { code: 'NotFound', message },
    HttpStatus.NOT_FOUND,
  );
  return err;
}

export function UnproceesableEntityError(message = 'Request cannot be processed') {
  const err = new HttpException(
    { code: 'UnprocessableEntity', message },
    HttpStatus.UNPROCESSABLE_ENTITY,
  );
  return err;
}

export function BreedingError(message = 'There was an error. Please try again later.') {
  const err = new HttpException(
    { code: 'BreedingError', message },
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
  return err;
}
