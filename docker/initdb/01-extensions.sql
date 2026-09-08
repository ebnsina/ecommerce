-- Postgres extensions the schema depends on, created before anything else runs.
--
-- pg_trgm backs the trigram index on product titles, which is what makes the
-- database's own product search usable when Typesense is not connected.
-- drizzle-kit cannot create an extension, so a fresh database fails to take the
-- schema without this.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
