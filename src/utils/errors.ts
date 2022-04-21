import { HttpException, HttpStatus } from '@nestjs/common';

export function UnauthorizedError(message = 'Request is not authorized.') {
  const err = new HttpException(
    { code: 'Unauthorized', message },
    HttpStatus.UNAUTHORIZED,
  );
  return err;
}

export function BadRequestError(message = 'Request payload is in invalid format.') {
  const err = new HttpException(
    { code: 'BadRequest', message },
    HttpStatus.BAD_REQUEST,
  );
  return err;
}

export function ConflictRequestError(message = 'The same resource already exists.') {
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
