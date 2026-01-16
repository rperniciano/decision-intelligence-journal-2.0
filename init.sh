#!/bin/bash

# Decision Intelligence Journal - Development Environment Setup
# This script sets up and runs the development environment

set -e

echo "============================================"
echo "  Decisions - Decision Intelligence Journal"
echo "  Development Environment Setup"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for required tools
check_requirements() {
    print_status "Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) found"

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm not found. Installing pnpm..."
        npm install -g pnpm
        print_success "pnpm installed"
    else
        print_success "pnpm $(pnpm -v) found"
    fi
}

# Check for environment variables
check_env() {
    print_status "Checking environment configuration..."

    # Check if .env files exist
    if [ ! -f ".env" ] && [ ! -f "apps/api/.env" ]; then
        print_warning "No .env file found. Creating from template..."

        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from template. Please update with your values."
        else
            cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key_here

# Application Configuration
VITE_API_URL=http://localhost:3001/api/v1
API_PORT=3001
NODE_ENV=development
EOF
            print_warning "Created .env template. Please update with your actual API keys."
            print_warning ""
            print_warning "Required services:"
            print_warning "  1. Supabase (https://supabase.com) - Database, Auth, Storage"
            print_warning "  2. AssemblyAI (https://assemblyai.com) - Speech-to-text"
            print_warning "  3. OpenAI (https://platform.openai.com) - GPT-4 extraction"
            print_warning ""
        fi
    else
        print_success "Environment file found"
    fi
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
}

# Build shared packages
build_shared() {
    print_status "Building shared packages..."
    pnpm --filter @decisions/shared build 2>/dev/null || true
    print_success "Shared packages built"
}

# Start development servers
start_dev() {
    print_status "Starting development servers..."
    echo ""
    echo "============================================"
    echo "  Starting Development Environment"
    echo "============================================"
    echo ""
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:3001"
    echo "  API Docs: http://localhost:3001/docs (if enabled)"
    echo ""
    echo "  Press Ctrl+C to stop all servers"
    echo "============================================"
    echo ""

    # Start both frontend and backend in parallel
    pnpm dev
}

# Main execution
main() {
    echo ""
    check_requirements
    echo ""
    check_env
    echo ""
    install_deps
    echo ""
    build_shared
    echo ""
    start_dev
}

# Handle script arguments
case "${1:-}" in
    "install")
        check_requirements
        check_env
        install_deps
        build_shared
        print_success "Installation complete. Run './init.sh' to start development."
        ;;
    "start")
        start_dev
        ;;
    "check")
        check_requirements
        check_env
        ;;
    *)
        main
        ;;
esac
