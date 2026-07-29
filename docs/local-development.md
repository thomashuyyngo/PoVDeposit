# Local development

Follow README setup, use the ignored API `.env`, run Prisma generate and migrations, then build before starting so Nest can serve `apps/web/out`. Production network values must remain `PUBLIC`; secrets and private keys must never enter source control.
