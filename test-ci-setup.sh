#!/bin/bash

echo "Testing CI/CD Pipeline Setup..."

# Check required files exist
echo "✓ Checking CI/CD configuration files..."

files=(
    ".github/workflows/ci.yml"
    ".github/workflows/release.yml"
    "api/.github/workflows/go-test.yml"
    ".releaserc.json"
    "api/Dockerfile"
    "api/.dockerignore"
    "web/Dockerfile"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
        exit 1
    fi
done

# Check API can build
echo "✓ Testing API build..."
cd api
if go build -o bin/test-api ./cmd/api; then
    echo "  ✓ API builds successfully"
    rm -f bin/test-api
else
    echo "  ✗ API build failed"
    exit 1
fi
cd ..

# Check web dependencies
echo "✓ Testing web dependencies..."
cd web
if command -v bun > /dev/null 2>&1; then
    if bun install --frozen-lockfile > /dev/null 2>&1; then
        echo "  ✓ Web dependencies install successfully"
    else
        echo "  ✗ Web dependency installation failed"
        exit 1
    fi
elif command -v npm > /dev/null 2>&1; then
    if npm ci > /dev/null 2>&1; then
        echo "  ✓ Web dependencies install successfully (using npm)"
    else
        echo "  ✗ Web dependency installation failed"
        exit 1
    fi
else
    echo "  ! Neither bun nor npm available, skipping web dependency test"
fi
cd ..

# Check semantic-release config
echo "✓ Checking semantic-release configuration..."
if [ -f ".releaserc.json" ]; then
    if jq empty .releaserc.json > /dev/null 2>&1; then
        echo "  ✓ Semantic release config is valid JSON"
    else
        echo "  ✗ Semantic release config is invalid JSON"
        exit 1
    fi
else
    echo "  ✗ Semantic release config missing"
    exit 1
fi

# Check Docker files
echo "✓ Testing Docker configurations..."
if docker buildx version > /dev/null 2>&1; then
    echo "  ✓ Docker buildx available"
    
    # Test API Dockerfile syntax
    if docker buildx build --dry-run -f api/Dockerfile api > /dev/null 2>&1; then
        echo "  ✓ API Dockerfile syntax valid"
    else
        echo "  ✗ API Dockerfile has syntax errors"
        exit 1
    fi
    
    # Test Web Dockerfile syntax
    if docker buildx build --dry-run -f web/Dockerfile web > /dev/null 2>&1; then
        echo "  ✓ Web Dockerfile syntax valid"
    else
        echo "  ✗ Web Dockerfile has syntax errors"
        exit 1
    fi
else
    echo "  ! Docker buildx not available, skipping Docker tests"
fi

echo ""
echo "🎉 CI/CD Pipeline setup test completed successfully!"
echo ""
echo "Next steps:"
echo "1. Commit your changes with a conventional commit message"
echo "2. Push to a feature branch and create a PR"
echo "3. Verify CI pipeline runs successfully"
echo "4. Merge to main to trigger the release pipeline"
echo ""
echo "Example commit messages:"
echo "  feat: add new API endpoints for user management"
echo "  fix: resolve database connection timeout"
echo "  docs: update API documentation"
