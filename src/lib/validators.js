export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function requireFields(form, fields) {
  for (const field of fields) {
    if (!isNonEmptyString(form[field])) return field;
  }
  return null;
}
