# CI/CD Configuration

This directory contains GitHub Actions workflows for automated building, testing, and releasing of the QuickLook SQLite Viewer plugin.

## Workflows

### 1. Build and Release (`build-and-release.yml`)
- **Triggers**: Push to main/master branch, new tags, and pull requests
- **Purpose**: Builds the plugin and creates releases for tagged versions
- **Features**:
  - Builds both Debug and Release configurations
  - Automatically updates version using git tags
  - Creates `.qlplugin` package
  - Uploads build artifacts
  - Creates GitHub releases for tagged versions
  - Separate PR build validation

### 2. Continuous Integration (`ci.yml`)
- **Triggers**: Push to main/master/develop branches and pull requests
- **Purpose**: Quick validation builds for development
- **Features**:
  - Matrix build (Debug/Release configurations)
  - Faster feedback for development
  - Artifact retention for 14 days

### 3. CodeQL Security Analysis (`codeql.yml`)
- **Triggers**: Push to main/master, pull requests, and weekly schedule
- **Purpose**: Automated security and code quality analysis
- **Features**:
  - Static code analysis for C# code
  - Security vulnerability detection
  - Code quality insights

## Usage

### For Developers
1. **Regular Development**: Push to any branch triggers CI validation
2. **Pull Requests**: Automated build verification runs on every PR
3. **Security**: CodeQL analysis runs automatically and on schedule

### For Releases
1. Create and push a tag: `git tag v1.2.3 && git push origin v1.2.3`
2. GitHub Actions will automatically:
   - Build the plugin
   - Create a GitHub release
   - Upload the `.qlplugin` file as a release asset

### Build Artifacts
- **Plugin Package**: `QuickLook.Plugin.SqliteViewer.qlplugin`
- **Release Binaries**: Full build output from `bin/Release/`

## Requirements
- Windows-based GitHub runners (required for .NET Framework builds)
- Git history for version generation
- Submodules support for QuickLook.Common dependency

## File Structure
```
.github/
├── workflows/
│   ├── build-and-release.yml    # Main build and release pipeline
│   ├── ci.yml                   # Continuous integration
│   ├── codeql.yml              # Security analysis
│   └── README.md               # This file
```

## Status Badges
Add these to your main README.md to show build status:

```markdown
[![Build and Release](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/actions/workflows/build-and-release.yml/badge.svg)](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/actions/workflows/build-and-release.yml)
[![CI](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/actions/workflows/ci.yml/badge.svg)](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/actions/workflows/ci.yml)
[![CodeQL](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/actions/workflows/codeql.yml/badge.svg)](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/actions/workflows/codeql.yml)
```