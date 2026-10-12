/**
 * Safe recursive Firestore data serializer for Next.js Server Components.
 * 
 * Next.js App Router enforces that only plain serializable objects, arrays,
 * and primitive values can cross the boundary from Server Components to Client Components.
 * Objects with prototypes or methods (especially `toJSON` or `toDate`, such as
 * Firestore Timestamp, GeoPoint, or DocumentReference instances) trigger:
 * "Only plain objects can be passed to Client Components from Server Components.
 * Objects with toJSON methods are not supported."
 * 
 * This helper recursively converts:
 * - Firestore `Timestamp` instances (or timestamp-like duck-typed objects) -> ISO 8601 strings
 * - JavaScript `Date` instances -> ISO 8601 strings
 * - Firestore `DocumentReference` instances -> document path strings
 * - Firestore `GeoPoint` instances -> plain { latitude, longitude } objects
 * - Firestore `Bytes` instances -> base64 strings
 * - Arrays -> recursively serialized arrays
 * - Plain objects & class instances -> plain JavaScript objects with Object.prototype
 * - Primitives (string, number, boolean, null, undefined) -> unchanged
 * - Circular references -> safely prevented using WeakSet
 */
export function serializeFirestoreData<T>(input: T, seen = new WeakSet<object>()): T {
  if (input === null || input === undefined) {
    return input;
  }

  // Primitives (string, number, boolean, symbol, bigint)
  if (typeof input !== 'object') {
    return input;
  }

  // JavaScript Date instance
  if (input instanceof Date) {
    return input.toISOString() as unknown as T;
  }

  const obj = input as unknown as Record<string, unknown>;

  // Firestore Timestamp duck typing: toDate() method
  if (typeof obj.toDate === 'function') {
    try {
      const d = (obj.toDate as () => Date)();
      if (d instanceof Date && !isNaN(d.getTime())) {
        return d.toISOString() as unknown as T;
      }
    } catch {
      // Fallback to seconds/nanoseconds check
    }
  }

  // Firestore Timestamp duck typing: seconds & nanoseconds
  if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    return new Date(obj.seconds * 1000 + Math.floor(obj.nanoseconds / 1000000)).toISOString() as unknown as T;
  }

  // Firestore DocumentReference duck typing
  if (typeof obj.path === 'string' && typeof obj.id === 'string' && 'firestore' in obj) {
    return obj.path as unknown as T;
  }

  // Firestore GeoPoint duck typing
  if (typeof obj.latitude === 'number' && typeof obj.longitude === 'number' && 'isEqual' in obj) {
    return {
      latitude: obj.latitude,
      longitude: obj.longitude,
    } as unknown as T;
  }

  // Firestore Bytes duck typing
  if (typeof obj.toBase64 === 'function') {
    return (obj.toBase64 as () => string)() as unknown as T;
  }

  // Circular reference guard
  if (seen.has(input)) {
    return null as unknown as T;
  }
  seen.add(input);

  // Arrays: recursively serialize every element
  if (Array.isArray(input)) {
    return input.map((item) => serializeFirestoreData(item, seen)) as unknown as T;
  }

  // Objects: construct a plain JavaScript object without non-plain prototypes or toJSON
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input)) {
    result[key] = serializeFirestoreData(val, seen);
  }

  return result as T;
}
