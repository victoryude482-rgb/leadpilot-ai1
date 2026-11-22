import type { AuthConfig } from "convex/server";

const issuer = process.env.SUPABASE_JWT_ISSUER;

if (!issuer) {
  throw new Error("SUPABASE_JWT_ISSUER must be set in the Convex deployment environment.");
}

export default {
  providers: [
    {
      domain: issuer,
      applicationID: "authenticated",
    },
  ],
} satisfies AuthConfig;
