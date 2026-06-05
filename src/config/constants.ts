const DEFAULT_JWT_SECRET = 'super_secret_key';

export const JWT_SECRET = process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET;

if (
  process.env.NODE_ENV === 'production' &&
  JWT_SECRET === DEFAULT_JWT_SECRET
) {
  throw new Error(
    'JWT_SECRET must be set to a non-default value in production',
  );
}
