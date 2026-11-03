/**
 * Global Error Handler Middleware
 * Formats MongoDB and Mongoose validation errors into structured, user-friendly responses.
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error Handler Intercepted]:', err.name || 'Error', '-', err.message);

  // Mongoose Schema Validation Error (HTTP 400)
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.keys(err.errors).map(field => ({
      field,
      message: err.errors[field].message,
      kind: err.errors[field].kind,
      value: err.errors[field].value
    }));

    return res.status(400).json({
      success: false,
      error: 'MongoDB Schema Validation Failed',
      message: 'One or more fields failed validation checks in Mongoose schema.',
      validationErrors: formattedErrors
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid Identifier Format',
      message: `Invalid ${err.kind} format for value '${err.value}' on path '${err.path}'.`,
      field: err.path
    });
  }

  // MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const duplicateFields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      success: false,
      error: 'Duplicate Key Error',
      message: `A document with the same unique key already exists: ${duplicateFields.join(', ')}.`,
      fields: duplicateFields
    });
  }

  // Default internal server error (HTTP 500)
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.'
  });
}
