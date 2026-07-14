# ZZEE repository guide

## Working agreement

- This repository is a static personal project hub. Preserve the owner's writing, ratings, and local data unless a requested change specifically targets them.
- Use the Node version declared in `.mise.toml`. Run `npm run check` before handing off code changes.
- Do not push, deploy, or rewrite Git history unless the owner explicitly asks.
- Never commit API keys, cookies, browser profiles, or `.env` files.

## Food-map data rules

- Treat `zzee's food map/js/data.js` as generated application data and the JSON files under `data/` as collection snapshots, not unquestionable truth.
- Kakao and NAVER official place APIs do not provide the complete rating/menu fields used by this project. The legacy collection scripts use undocumented pages or endpoints and may break or conflict with provider terms.
- Do not run a live provider collection unless the owner explicitly requests it and the current provider terms have been checked.
- Applying provider results is always a two-step operation: preview first, then repeat with `--write` only after reviewing skipped and suspicious matches.
- A missing coordinate is unknown, never zero distance. Reject ambiguous names, wrong districts, invalid ratings, and stale or malformed dates.
- Keep a source URL, provider place ID, and `checkedAt` date for every imported provider record. A platform rating is separate from the owner's personal rating.

See `zzee's food map/docs/DATA-PIPELINE.md` for the durable workflow and learned constraints.
