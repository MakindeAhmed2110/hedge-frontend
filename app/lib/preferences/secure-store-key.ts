/** SecureStore keys may only use alphanumeric characters, ".", "-", and "_". */
export function sanitizeSecureStoreKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}
