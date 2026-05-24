# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-24

### Added
- **Multi-provider support:** The app is no longer locked to Google Gemini. Pick from:
    - **Google Gemini** (cloud) — all 1.5, 2.0, 2.5, and 3 Pro Preview models.
    - **OpenAI** (cloud) — `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3`, `o4-mini`.
    - **LM Studio** (local) — connects to LM Studio's local OpenAI-compatible server.
    - **llama.cpp** (local) — connects to `llama-server`'s OpenAI-compatible endpoint.
- **In-app provider settings panel** with API key input, base URL configuration, model selector, "Test Connection" and "Refresh from server" buttons.
- **Prominent local-setup checklists** built into the UI for LM Studio (Serve on Local Network, CORS, vision-capable model selection) and llama.cpp (`--mmproj`, `--cors`, recommended GGUF builds).
- **Dynamic model discovery** for local providers via `GET /v1/models`.
- **Settings persistence** to `localStorage` so provider/model/key choices survive a reload.
- **Provider + model metadata** is now recorded in the exported PDF documentation and processing log.

### Changed
- **Provider abstraction:** AI calls were extracted out of `App.tsx` into a `utils/providers/` module (`GeminiProvider`, `OpenAICompatibleProvider`). LM Studio and llama.cpp share the OpenAI-compatible implementation.
- **API key handling:** Keys can now be entered in the UI (stored in browser localStorage) in addition to the `.env` file. The single `API_KEY` env var was removed; use `GEMINI_API_KEY` and/or `OPENAI_API_KEY`.
- **Image payloads** are now built per-provider (Gemini `inlineData` vs. OpenAI `image_url` with base64 data URLs).
- **README** rewritten to cover all four providers with step-by-step local-LLM setup.

### Migration notes
- If you were using `API_KEY` in your `.env`, rename it to `GEMINI_API_KEY` (it should already be that name from 1.0.0).
- No image/caption data is lost — existing workflows continue unchanged on Gemini.

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
