# LoRA Captioner

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg) [![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?logo=discord&logoColor=white)](https://discord.com/invite/pAz4Bt3rqb)

A powerful, AI-assisted tool for building high-quality image datasets for training LoRA (Low-Rank Adaptation) models. Caption images using **Google Gemini**, **OpenAI**, or your **own local LLM** (LM Studio / llama.cpp), manage unique dataset tokens, and export everything as a training-ready ZIP.

**[View Changelog](CHANGELOG.md)**

## 🚀 What's New in 2.0

- **Choose your AI provider.** Gemini, OpenAI, LM Studio (local), or llama.cpp (local) — all selectable from the UI, no rebuild needed.
- **Run fully offline** with a local vision model in LM Studio or llama.cpp.
- **In-UI setup checklists** for local servers so you don't have to dig through docs.
- **Settings persist** in your browser, so swap providers freely between sessions.

## ✨ Features

- **AI-Powered Captioning** with your choice of:
    - Google Gemini 3 Pro Preview, 2.5 Pro/Flash, 2.0 Flash, 1.5 Pro/Flash
    - OpenAI gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, o3, o4-mini
    - Any vision-capable model loaded in **LM Studio** or **llama.cpp**
- **Multiple Captioning Styles:** Descriptive (literal), Danbooru tags, WD1.4 tags, CLIP/T5 sentence.
- **Unique Dataset Identifiers:** Automatically inject trigger tokens or style descriptions into every caption.
- **Batch Processing:** Caption all images or only the selected ones; interrupt mid-batch.
- **Smart Export:** Download a ZIP with images, `.txt` caption files, a PDF documentation report (overview + word cloud), and a processing log.
- **Privacy-Focused:** Keys live in browser localStorage or your `.env` — never transmitted anywhere except the provider you choose. Local providers don't transmit data off your machine at all.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, TypeScript
- **AI:** Google Generative AI SDK (Gemini) + OpenAI-compatible HTTP (everything else)
- **Utilities:** JSZip, jsPDF, wordcloud2.js

## 📋 Prerequisites

- **Node.js** 18+
- **npm**

## ⚙️ Installation

```bash
git clone https://github.com/RalFingerLP/lora-captioner.git
cd lora-captioner
npm install
npm run dev
```

Then open `http://localhost:5173`.

## 🔑 Provider Setup

You can configure provider credentials directly in the app's **AI Provider** panel — keys are saved to your browser's localStorage. Optionally, pre-fill them via a `.env` file:

```env
# .env (optional — both keys are optional and you can also paste them in the UI)
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
```

### Option A — Google Gemini (Cloud)

1. Get a free key from [Google AI Studio](https://aistudio.google.com/).
2. Select **Google Gemini (Cloud)** in the provider dropdown.
3. Paste the key into the API Key field, pick a model, and you're ready.

### Option B — OpenAI (Cloud)

1. Get a key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Select **OpenAI (Cloud)**, paste the key, pick a model.
3. All vision models are pre-listed (`gpt-4o`, `gpt-4.1`, `o3`, etc.).

### Option C — LM Studio (Local, Recommended for Offline)

1. Install [LM Studio](https://lmstudio.ai/).
2. In LM Studio's model browser, **filter by "Vision"** and download a vision-capable model. Tested picks:
    - `Qwen2.5-VL-7B-Instruct` — recommended balance of speed/quality
    - `Qwen2.5-VL-3B-Instruct` — lower VRAM
    - `MiniCPM-V-2.6` — strong detail
    - `Llama-3.2-11B-Vision-Instruct`
    - `LLaVA-1.6` variants
3. Open the **Developer** tab → **Local Server**.
4. **Load your vision model** from the model selector at the top of the server view.
5. **Enable "Serve on Local Network"** only if reaching from another machine. For local use the default `localhost:1234` works.
6. Make sure **CORS is enabled** in the server settings (default in recent LM Studio).
7. Click **Start Server**.
8. Back in LoRA Captioner: pick **LM Studio (Local)** as the provider. Default URL is `http://localhost:1234/v1`.
9. Click **Test Connection** → **↻ Refresh from server** to populate the model dropdown.

The in-app panel has the same checklist with click-through links — refer to it if you get stuck.

### Option D — llama.cpp Server (Local, Advanced)

1. Build or download a recent `llama-server` from [ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp).
2. Download both a vision model GGUF **and** its matching multimodal projector (`mmproj`). Examples:
    - `Qwen2.5-VL-7B-Instruct-GGUF` + `mmproj-f16`
    - `MiniCPM-V-2_6-gguf` + `mmproj`
    - `LLaVA-v1.6-Mistral-7B-GGUF` + `mmproj`
3. Start the server **with the projector and CORS**:

    ```bash
    ./llama-server \
      -m ./qwen2.5-vl-7b-instruct-q4_k_m.gguf \
      --mmproj ./qwen2.5-vl-7b-instruct-mmproj-f16.gguf \
      --host 0.0.0.0 --port 8080 \
      --ctx-size 8192 \
      --cors
    ```

    The `--mmproj` flag is what enables image input. Without `--cors` the browser will block the response.
4. In LoRA Captioner: pick **llama.cpp server (Local)**, default URL `http://localhost:8080/v1`.
5. **Test Connection** → **↻ Refresh from server** → pick the reported model id.

## 📖 User Guide

1. **Configure a provider** (see above).
2. **Upload Images:** Drag and drop a folder or select images.
3. **Choose Method:** Descriptive for Flux/Qwen-Image, Danbooru/WD14 for SD1.5-style anime, CLIP/T5 for compact sentence captions.
4. **Set Instructions (Optional):** Add a system prompt to guide the AI (e.g., "Focus on clothing details").
5. **Unique Identifier (Optional):** Enter a trigger token (e.g., `ral-trigger`) to prefix all captions. The AI can suggest one.
6. **Generate:** Click "Caption All" — or select a subset of images first and use "Caption Selected".
7. **Review & Edit:** Click any caption to tweak it.
8. **Download:** Click "Download ZIP" to get the training-ready dataset (images + `.txt` + PDF + log).

## 🧪 Tips for Local Models

- **Quality scales with model size.** Qwen2.5-VL-7B is excellent for descriptive captioning. Below 3B parameters, output quality drops noticeably.
- **First request is slow.** The first image after loading a model usually takes longer while the projector warms up.
- **Token counts may be missing** for some local backends — this is normal, captions still work.
- **If captions look generic or hallucinated**, your projector (`mmproj`) is likely not loaded — restart with `--mmproj`.

## 📄 License

MIT License. Copyright (c) 2025-2026.

See full text in the source for details.
