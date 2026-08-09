# Reliable Lead Discovery

LeadPilot must not manufacture prospects or claim that a business is real based only on an AI-generated name.

## Source policy

Every discovered business must retain its provider/source. Provider adapters are interchangeable and can be free-tier or self-hosted.

## Verification policy

A supplied website, phone number, or email is a **present contact field**, not automatically verified. Verification requires the corresponding check and stored evidence.

## Ranking policy

Lead score is a prioritization signal. It is not a guarantee that a prospect will buy, reply, or be a high-value customer.

## Provider architecture

`LeadProvider` handles discovery. `WebsiteVerifier` handles website checks. Future email/phone/domain verification providers should follow the same adapter pattern.

## Next provider work

Implement a free-first provider adapter appropriate to the deployment environment, with:

- rate limiting
- deduplication
- source attribution
- terms/compliance review
- retries with bounded timeouts
- no scraping of restricted/private data
- no fabricated contact details
