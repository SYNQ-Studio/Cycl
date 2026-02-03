type NodeEnv = "development" | "test" | "production";
type EnvConfig = {
    NODE_ENV: NodeEnv;
    PORT: number;
    CORS_ORIGIN: string;
    CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    CLERK_JWT_ISSUER?: string;
    CLERK_AUTHORIZED_PARTIES?: string[];
    SUPABASE_DATABASE_URL: string;
    DB_POOL_MAX: number;
    DB_SSL: "require" | "prefer" | "disable";
    DB_AUTH_ROLE: string;
};
export declare const env: EnvConfig;
export {};
//# sourceMappingURL=env.d.ts.map