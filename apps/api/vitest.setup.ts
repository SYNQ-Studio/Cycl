process.env.NODE_ENV = "test";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
process.env.CLERK_PUBLISHABLE_KEY =
  process.env.CLERK_PUBLISHABLE_KEY ?? "test-clerk-pk";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ?? "test-clerk-sk";
process.env.SUPABASE_DATABASE_URL =
  process.env.SUPABASE_DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/test";
process.env.DB_SSL = process.env.DB_SSL ?? "disable";
process.env.DB_AUTH_ROLE = process.env.DB_AUTH_ROLE ?? "authenticated";
