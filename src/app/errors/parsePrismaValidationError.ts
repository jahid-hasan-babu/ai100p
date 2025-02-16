
const parsePrismaValidationError = (errorMessage: string): string => {
  // Parse missing argument errors
  const missingFieldsRegex = /Argument `(.+?)` is missing\./g;
  let match;
  const missingFields: string[] = [];

  while ((match = missingFieldsRegex.exec(errorMessage)) !== null) {
    missingFields.push(match[1]);
  }

  // Parse invalid value errors
  const invalidValueRegex =
    /Argument `(.+?)`: Invalid value provided. Expected (.+), provided (.+)\./g;
  const invalidValues: string[] = [];

  while ((match = invalidValueRegex.exec(errorMessage)) !== null) {
    const field = match[1];
    const expectedType = match[2];
    const providedValue = match[3];
    invalidValues.push(
      `${field}: Expected ${expectedType}, provided ${providedValue}`
    );
  }

  const messages = [];

  if (missingFields.length) {
    messages.push(`Missing fields: ${missingFields.join(", ")}`);
  }

  if (invalidValues.length) {
    messages.push(`Invalid values: ${invalidValues.join("; ")}`);
  }

  return messages.length ? messages.join("; ") : "No validation errors found.";
};

export default parsePrismaValidationError;

