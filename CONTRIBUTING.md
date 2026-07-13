# Contributing to InternLink

Thank you for contributing! Please follow these guidelines to keep the project consistent and maintainable.

## Before You Start

### 1. Environment Setup
- [ ] Install required toolchain (see [README.md#toolchain-requirements](README.md#toolchain-requirements))
- [ ] Verify versions: `dotnet --version && node --version && npm --version && docker --version && dotnet-ef --version && git --version`
- [ ] Copy `.env.example` to `.env.development` and fill in values
- [ ] Generate a secure JWT secret: `openssl rand -base64 32`
- [ ] Start infrastructure: `docker-compose up -d`
- [ ] Verify services: `docker-compose ps` (all should show "healthy")

### 2. Branch Strategy
- `main` — production-ready, protected
- `develop` — integration branch for ongoing work
- Feature branches: `feature/<short-description>` from `develop`
- Bug fixes: `fix/<short-description>` from `develop`
- Hotfixes: `hotfix/<short-description>` from `main`

### 3. Before Coding
- [ ] Pick or create an issue in GitHub Issues
- [ ] Assign yourself to the issue
- [ ] Create a feature branch from `develop`: `git checkout develop && git pull && git checkout -b feature/my-feature`
- [ ] Read existing code in the relevant area to understand patterns

## While Coding

### Code Style
- **C#**: Follow .NET naming conventions, use `dotnet format` before committing
- **TypeScript/React**: ESLint + Prettier (run `npm run lint` and `npm run format`)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **Commits**: One logical change per commit; reference issue (#123)

### Database Changes
- [ ] Create EF Core migration: `dotnet ef migrations add MigrationName -p src/InternLink.Infrastructure -s src/InternLink.Api`
- [ ] Review generated migration SQL
- [ ] Test migration up/down locally

### API Changes
- [ ] Update OpenAPI/Swagger annotations
- [ ] Update or add integration tests
- [ ] Document breaking changes in PR description

### Frontend Changes
- [ ] Run type check: `npm run typecheck`
- [ ] Run lint: `npm run lint`
- [ ] Test in browser (dev server: `npm run dev`)
- [ ] Ensure responsive design works

### Testing
- [ ] Write unit tests for new logic (xUnit for .NET, Vitest/Jest for frontend)
- [ ] Run existing tests: `dotnet test` / `npm test`
- [ ] All tests must pass before PR

## Before Opening a Pull Request

- [ ] Rebase onto latest `develop`: `git fetch origin && git rebase origin/develop`
- [ ] Run full test suite locally
- [ ] Run linters/formatters: `dotnet format` / `npm run lint && npm run format`
- [ ] Update documentation if behavior changed (README, API docs, comments)
- [ ] Self-review your diff: `git diff develop...HEAD`
- [ ] Write a clear PR description:
  - What problem does this solve?
  - How was it tested?
  - Any breaking changes?
  - Screenshots for UI changes

## Pull Request Process

1. Open PR against `develop` (not `main`)
2. Fill out the PR template completely
3. Request review from at least 1 team member
4. Address all review comments (resolve conversations)
5. Ensure CI passes (build, tests, lint)
6. Squash and merge after approval
7. Delete the feature branch after merge

## After Merge

- [ ] Pull latest `develop`: `git checkout develop && git pull`
- [ ] Delete local feature branch: `git branch -d feature/my-feature`
- [ ] If deployed to staging, verify the feature works in staging environment
- [ ] Close the associated GitHub issue (or let auto-close via "Closes #123" in PR description)

## Release Process (Maintainers Only)

1. Create release branch: `git checkout -b release/v1.x.x develop`
2. Version bump, update CHANGELOG.md
3. PR to `main` with version bump
4. Tag release: `git tag -a v1.x.x -m "Release v1.x.x"`
5. Deploy to production
6. Merge `main` back to `develop`

## Code of Conduct

- Be respectful and inclusive
- No harassment, discrimination, or offensive language
- Focus on constructive feedback
- Follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

## Questions?

- Check existing issues and discussions first
- Ask in the PR or issue comments
- For urgent issues, tag maintainers

---

**TL;DR Checklist for Every PR:**
- [ ] Branched from `develop`
- [ ] Tests pass locally
- [ ] Lint/format clean
- [ ] Docs updated
- [ ] PR description complete
- [ ] CI green
- [ ] Reviewed & approved