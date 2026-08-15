# Multi-source data layer

Victory AI keeps Supabase as the authentication and primary relational store while allowing additional data sources to be added behind provider interfaces.

Rules:
- Never fabricate lead records or contact details.
- Every provider must return source metadata.
- Merge and deduplicate by stable business identity.
- Enforce the user's requested country, location and business type before ranking.
- Providers are optional: unavailable providers should not break the entire search.
- Cache/search indexes may improve speed but must not become the source of truth.

Recommended future adapters:
- Render Postgres or another PostgreSQL database for durable lead/research storage.
- Redis-compatible key-value store for caching and job state.
- Business directories/maps and approved enrichment APIs for additional verified business data.
