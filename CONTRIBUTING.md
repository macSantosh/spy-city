# Contributing

## Before You Start

- Open an issue before large changes
- Keep changes focused and reviewable
- Do not commit secrets, API keys, or local env files

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Development Guidelines

- Use TypeScript throughout
- Keep React DOM UI in `src/components/`
- Keep React Three Fiber scene code in `src/city/`
- Use Zustand for communication between UI and scene state
- Avoid unrelated refactors in the same pull request

## Pull Requests

- Describe what changed and why
- Include screenshots or a short clip for visible UI/3D changes when possible
- Mention testing performed locally
- Link related issues

## Security

If you find a vulnerability or accidentally expose a secret, do not open a public issue. Follow [SECURITY.md](SECURITY.md).