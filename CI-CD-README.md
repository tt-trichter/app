# CI/CD Pipeline Documentation

This document describes the continuous integration and deployment pipeline for the Trichter application, which consists of a web frontend (SvelteKit) and API backend (Go).

## Overview

The CI/CD pipeline is designed to:
- Run tests and quality checks for both web and API applications
- Build Docker images for production deployment
- Use semantic versioning for releases
- Deploy to GitHub Container Registry (GHCR)

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
1. **Changes Detection** - Determines which services (web/api) have changes
2. **Web Application** - Tests, lints, and builds the SvelteKit app
3. **API Application** - Tests, lints, and builds the Go API
4. **Docker Preview** - Builds Docker images for PRs (no push)

**Features:**
- Conditional execution based on file changes
- Parallel execution of web and API jobs
- Artifact uploads for debugging
- Multi-platform Docker builds (AMD64, ARM64)
- GitHub cache optimization

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push to `main` branch (after CI passes)

**Jobs:**
1. **Changes Detection** - Determines which services need release
2. **Semantic Release** - Generates version numbers and release notes
3. **Web Build** - Builds web application for release
4. **API Build** - Builds API application for release
5. **Docker Release** - Builds and pushes Docker images to GHCR

**Features:**
- Semantic versioning using conventional commits
- Automated changelog generation
- Multi-service Docker image builds
- Container image attestation for security
- Service-specific image tags

### 3. API Tests Workflow (`api/.github/workflows/go-test.yml`)

**Triggers:**
- Changes to `api/**` files
- Push/PR to `main` or `develop`

**Features:**
- Go linting with golangci-lint
- Race condition detection
- Code coverage reporting to Codecov
- Build verification

## Semantic Release

The project uses semantic-release for automated versioning and releases.

### Configuration (`.releaserc.json`)
- **Branches:** `main` only
- **Plugins:**
  - Commit analyzer (conventional commits)
  - Release notes generator
  - Changelog generator
  - Git plugin for version bumps
  - GitHub releases

### Commit Message Format
Use conventional commits for automatic version bumping:

```
feat: add new user authentication
fix: resolve database connection issue
docs: update API documentation
chore: update dependencies
```

**Version Bumping:**
- `feat:` → Minor version bump (1.0.0 → 1.1.0)
- `fix:` → Patch version bump (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → Major version bump (1.0.0 → 2.0.0)

## Docker Images

### Image Naming Convention
Images are pushed to GitHub Container Registry with the following naming:

```
ghcr.io/tt-trichter/app:web-v1.2.3
ghcr.io/tt-trichter/app:web-latest
ghcr.io/tt-trichter/app:api-v1.2.3
ghcr.io/tt-trichter/app:api-latest
```

### Image Tags
- `{service}-v{version}` - Specific semantic version
- `{service}-{major}.{minor}` - Major.minor version
- `{service}-{major}` - Major version
- `{service}-latest` - Latest release
- `{service}-main` - Latest from main branch

### Multi-Platform Support
All images are built for:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)

## Environment Variables and Secrets

### Required GitHub Secrets
- `GITHUB_TOKEN` - Automatically provided by GitHub
- `CODECOV_TOKEN` - For code coverage reporting (optional)

### Environment Configuration
Each service has its own environment configuration:

**Web Application:**
- Uses Bun for package management
- Environment variables in production Docker image
- SvelteKit build optimization

**API Application:**
- Go 1.23+ required
- Database connection via environment variables
- Static binary compilation for minimal Docker image

## File Structure

```
.github/workflows/
├── ci.yml              # Main CI pipeline
└── release.yml         # Release and deployment pipeline

api/
├── .github/workflows/
│   └── go-test.yml     # API-specific tests
├── Dockerfile          # API container definition
├── .dockerignore       # API Docker ignore rules
└── .env               # API environment variables

web/
├── Dockerfile          # Web container definition
└── package.json        # Node.js dependencies and scripts

.releaserc.json         # Semantic release configuration
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feat/new-feature

# Make changes with conventional commits
git commit -m "feat: add user profile management"

# Push and create PR
git push origin feat/new-feature
```

### 2. Pull Request Process
1. CI workflow runs automatically
2. Both web and API tests must pass
3. Docker images built for testing
4. Code review required
5. Merge to main triggers release

### 3. Release Process
1. Merge to main branch
2. Semantic release analyzes commits
3. Version number generated automatically
4. Docker images built and pushed
5. GitHub release created with changelog

## Monitoring and Debugging

### Build Artifacts
- Web build artifacts available for 7 days
- API binary artifacts available for 7 days
- Docker build cache persisted between runs

### Logs and Debugging
- All workflow logs available in GitHub Actions
- Failed builds show specific error details
- Coverage reports uploaded to Codecov
- Container scan results in security tab

### Status Checks
- All workflows must pass before merge
- Branch protection rules enforced
- Required reviewers for main branch

## Security Features

### Container Security
- Multi-stage Docker builds
- Minimal base images (Alpine Linux)
- No unnecessary packages
- Build provenance attestation

### Supply Chain Security
- Dependency scanning
- Container image scanning
- SBOM (Software Bill of Materials) generation
- Signed container images

## Troubleshooting

### Common Issues

**1. Build Failures**
- Check the specific job logs in GitHub Actions
- Verify dependencies are up to date
- Ensure tests pass locally

**2. Docker Build Issues**
- Check Dockerfile syntax
- Verify build context includes necessary files
- Review .dockerignore for excluded files

**3. Release Issues**
- Ensure commit messages follow conventional format
- Check that main branch is protected
- Verify GitHub token permissions

**4. Test Failures**
- Run tests locally first
- Check for environment-specific issues
- Review test coverage requirements

### Getting Help
- Check GitHub Actions logs for detailed error messages
- Review this documentation for configuration details
- Create an issue in the repository for persistent problems
