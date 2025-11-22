# LoRA Captioner

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

A powerful, AI-assisted tool designed to streamline the process of creating high-quality image datasets for training LoRA (Low-Rank Adaptation) models. This application allows you to easily caption images using state-of-the-art Google Gemini AI models, manage unique dataset tokens, and export everything in a format ready for training.

![UI](https://github.com/RalFingerLP/lora-captioner/blob/main/ui.png?raw=true)

**[View Changelog](CHANGELOG.md)**

## 🚀 Features

*   **AI-Powered Captioning:** Automatically generate detailed captions using the latest Google Gemini models:
    *   **Gemini 3.0 Pro Preview** (Cutting-edge multimodal capabilities)
    *   **Gemini 2.5 Pro & Flash** (High performance and speed)
    *   **Gemini 2.0 Flash** (Extremely fast and efficient)
    *   **Gemini 1.5 Pro & Flash** (Reliable stable versions)
*   **Multiple Captioning Styles:** Choose the method that fits your training needs:
    *   **Descriptive:** Detailed natural language descriptions (strictly literal, no fluff).
    *   **Danbooru-Style Tags:** Comma-separated tags standard in anime model training.
    *   **WD1.4-Style Tags:** Optimized for Waifu Diffusion style tagging.
    *   **CLIP/T5-Style:** Concise sentences optimized for CLIP/T5 text encoders.
*   **Unique Dataset Identifiers:** Automatically inject unique trigger words (tokens) or style descriptions into every caption to ensure your LoRA learns specific concepts.
*   **Batch Processing:** Caption individual images or process your entire dataset at once.
*   **Smart Export:** Download your dataset as a ZIP file containing:
    *   Original images.
    *   Corresponding `.txt` caption files.
    *   A PDF documentation report with dataset overview and word clouds.
    *   A processing log.
*   **Privacy Focused:** Your API key is stored locally in your environment variables and is never shared.

## 🛠️ Tech Stack & Credits

This project was built using **Visual Studio Code** with **Cline**, powered by **Google Gemini**.

*   **Frontend:** React, Vite, TypeScript
*   **AI Integration:** Google Generative AI SDK
*   **Utilities:** JSZip (Compression), jsPDF (Documentation)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   **Node.js** (Version 18 or higher recommended)
*   **npm** (Node Package Manager)

## ⚙️ Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/RalFingerLP/lora-captioner.git
    cd lora-captioner
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Key:**
    *   Get a free API key from [Google AI Studio](https://aistudio.google.com/).
    *   Create a `.env` file in the root directory by copying the example file.
    *   Open the newly created `.env` file in a text editor and replace the placeholder with your actual key:
        ```env
        GEMINI_API_KEY=your_actual_api_key_here
        ```
    *   *Note: The `.env` file is gitignored to keep your key safe.*

4.  **Run the Application:**
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## 📖 User Guide

1.  **Upload Images:** Drag and drop a folder or select images to begin.
2.  **Select AI Model:** Choose from the latest Gemini models in the dropdown (e.g., Gemini 2.0 Flash, Gemini 3 Pro Preview).
3.  **Choose Method:** Select your desired captioning style (e.g., Descriptive for Qwen/Flux, Danbooru for SD1.5 or similar models).
4.  **Set Instructions (Optional):** Add a "System Prompt" to guide the AI (e.g., "Focus on clothing details").
5.  **Unique Identifier (Optional):** Enter a unique token (e.g., `ral-trigger`) to prefix all captions. You can ask the AI to suggest one!
6.  **Generate:** Click "Caption All" to process the entire dataset.
7.  **Review & Edit:** Click on any image to manually tweak the generated text.
8.  **Download:** Click "Download ZIP" to get your training-ready dataset.

## 📄 License

This project is licensed under the **MIT License**.

```text
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
