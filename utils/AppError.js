class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Mark this error as operational (known application error), to distinguish it from unexpected system crashes.
    this.isOperational = true;

    // Capture the stack trace (where the error occurred in code)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
