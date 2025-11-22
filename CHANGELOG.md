# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-22

### Added
- **New Models:** Added support for:
    - `gemini-3-pro-preview`
    - `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`
    - `gemini-2.0-flash` (Default), `gemini-2.0-flash-lite-preview`
    - `gemini-1.5-pro-002`, `gemini-1.5-flash-002`
- **Strict Captioning:** Updated prompts to enforce strictly literal descriptions, removing interpretation, mood, and "is visible" phrasing.
- **Output Cleaning:** Added post-processing to strip introductory text (e.g., "Here is a caption...") and markdown labels.
- **Documentation:** Added `README.md` with detailed installation, usage, and configuration instructions.
- **Security:** Added `.env.example` and updated `.gitignore` to exclude `.env` files.
- **Changelog:** Added `CHANGELOG.md` to track version history.

### Changed
- **Default Model:** Set default model to `gemini-2.0-flash` for improved speed and availability.
- **Cleaned Model List:** Removed outdated or invalid model aliases (e.g., `-latest` versions that were causing 404s) and marked old ones as legacy.
- **Removed Pricing:** Removed cost estimation logic and UI elements to focus purely on token usage.
