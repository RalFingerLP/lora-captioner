import React, { useState } from 'react';
import { PROVIDER_META, type ProviderId } from '../utils/providers';

interface ProviderSettingsProps {
  providerId: ProviderId;
  model: string;
  apiKey: string;
  baseUrl: string;
  availableModels: string[];
  isFetchingModels: boolean;
  fetchModelsError: string | null;
  connectionStatus: 'idle' | 'testing' | 'ok' | 'error';
  connectionMessage: string | null;
  disabled: boolean;
  onProviderChange: (id: ProviderId) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  onBaseUrlChange: (url: string) => void;
  onRefreshModels: () => void;
  onTestConnection: () => void;
}

const ProviderSettings: React.FC<ProviderSettingsProps> = ({
  providerId,
  model,
  apiKey,
  baseUrl,
  availableModels,
  isFetchingModels,
  fetchModelsError,
  connectionStatus,
  connectionMessage,
  disabled,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onBaseUrlChange,
  onRefreshModels,
  onTestConnection,
}) => {
  const meta = PROVIDER_META[providerId];
  const [showApiKey, setShowApiKey] = useState(false);
  const [showLocalHelp, setShowLocalHelp] = useState(true);

  return (
    <div className="w-full p-4 bg-gray-800 rounded-lg shadow-md space-y-4">
      <div>
        <label htmlFor="providerSelect" className="block text-sm font-medium text-gray-300 mb-2">
          AI Provider
        </label>
        <select
          id="providerSelect"
          value={providerId}
          onChange={e => onProviderChange(e.target.value as ProviderId)}
          className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          disabled={disabled}
        >
          {(Object.keys(PROVIDER_META) as ProviderId[]).map(id => (
            <option key={id} value={id}>
              {PROVIDER_META[id].label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-400">{meta.helpText}</p>
      </div>

      {meta.needsApiKey && (
        <div>
          <label htmlFor="apiKeyInput" className="block text-sm font-medium text-gray-300 mb-2">
            API Key
          </label>
          <div className="flex items-center gap-2">
            <input
              id="apiKeyInput"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => onApiKeyChange(e.target.value)}
              placeholder={providerId === 'gemini' ? 'AIza...' : 'sk-...'}
              className="flex-grow p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 text-sm placeholder-gray-500"
              disabled={disabled}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(s => !s)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md text-xs"
              disabled={disabled}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Stored locally in your browser only. Never sent anywhere except the provider you choose.
          </p>
        </div>
      )}

      {meta.needsBaseUrl && (
        <div>
          <label htmlFor="baseUrlInput" className="block text-sm font-medium text-gray-300 mb-2">
            Server URL
          </label>
          <div className="flex items-center gap-2">
            <input
              id="baseUrlInput"
              type="text"
              value={baseUrl}
              onChange={e => onBaseUrlChange(e.target.value)}
              placeholder={meta.defaultBaseUrl}
              className="flex-grow p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 text-sm placeholder-gray-500 font-mono"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={onTestConnection}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs whitespace-nowrap disabled:opacity-50"
              disabled={disabled || connectionStatus === 'testing'}
            >
              {connectionStatus === 'testing' ? 'Testing…' : 'Test Connection'}
            </button>
          </div>
          {connectionStatus !== 'idle' && connectionMessage && (
            <p
              className={`mt-2 text-xs ${
                connectionStatus === 'ok'
                  ? 'text-green-400'
                  : connectionStatus === 'error'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
              {connectionStatus === 'ok' ? '✓ ' : connectionStatus === 'error' ? '✗ ' : ''}
              {connectionMessage}
            </p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="modelSelect" className="block text-sm font-medium text-gray-300">
            Model
          </label>
          {meta.isLocal && (
            <button
              type="button"
              onClick={onRefreshModels}
              className="text-xs text-purple-300 hover:text-purple-200 disabled:opacity-50"
              disabled={disabled || isFetchingModels}
            >
              {isFetchingModels ? 'Loading…' : '↻ Refresh from server'}
            </button>
          )}
        </div>

        {meta.isLocal ? (
          <>
            {availableModels.length > 0 ? (
              <select
                id="modelSelect"
                value={model}
                onChange={e => onModelChange(e.target.value)}
                className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                disabled={disabled}
              >
                {availableModels.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="modelSelect"
                type="text"
                value={model}
                onChange={e => onModelChange(e.target.value)}
                placeholder="e.g. qwen2.5-vl-7b-instruct (or click Refresh)"
                className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-mono"
                disabled={disabled}
              />
            )}
            {fetchModelsError && (
              <p className="mt-2 text-xs text-red-400">{fetchModelsError}</p>
            )}
          </>
        ) : (
          <select
            id="modelSelect"
            value={model}
            onChange={e => onModelChange(e.target.value)}
            className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            disabled={disabled}
          >
            {meta.models.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        <p className="mt-2 text-xs text-gray-400">
          {meta.isLocal
            ? 'The model must be loaded in your local server and must support vision (image input).'
            : 'All listed models support image input.'}
        </p>
      </div>

      {meta.isLocal && (
        <div className="border border-yellow-700 bg-yellow-900/30 rounded-md p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-yellow-300">
              ⚠ Setup checklist — {providerId === 'lmstudio' ? 'LM Studio' : 'llama.cpp'}
            </h4>
            <button
              type="button"
              onClick={() => setShowLocalHelp(s => !s)}
              className="text-xs text-yellow-300 hover:text-yellow-200"
            >
              {showLocalHelp ? 'Hide' : 'Show'}
            </button>
          </div>
          {showLocalHelp && providerId === 'lmstudio' && <LMStudioHelp />}
          {showLocalHelp && providerId === 'llamacpp' && <LlamaCppHelp />}
        </div>
      )}
    </div>
  );
};

const LMStudioHelp: React.FC = () => (
  <ol className="mt-2 text-xs text-yellow-100 space-y-2 list-decimal list-inside">
    <li>
      <strong>Install LM Studio</strong> from{' '}
      <a
        href="https://lmstudio.ai/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-yellow-200 hover:text-yellow-50"
      >
        lmstudio.ai
      </a>
      .
    </li>
    <li>
      <strong>Download a vision-capable model</strong> from the in-app model browser. Tested options:
      <ul className="list-disc list-inside ml-4 mt-1 text-yellow-200">
        <li>
          <code className="bg-gray-900/60 px-1 rounded">Qwen2.5-VL-7B-Instruct</code> (recommended — fast and accurate)
        </li>
        <li>
          <code className="bg-gray-900/60 px-1 rounded">Qwen2.5-VL-3B-Instruct</code> (lower VRAM)
        </li>
        <li>
          <code className="bg-gray-900/60 px-1 rounded">MiniCPM-V-2.6</code> (good detail)
        </li>
        <li>
          <code className="bg-gray-900/60 px-1 rounded">Llama-3.2-11B-Vision-Instruct</code>
        </li>
        <li>
          <code className="bg-gray-900/60 px-1 rounded">LLaVA-1.6</code> variants
        </li>
      </ul>
      Filter the model browser by <em>"Vision"</em> to see only models that accept images.
    </li>
    <li>
      Open the <strong>Developer</strong> tab (the {'<>'} icon in the left sidebar) → <strong>"Local Server"</strong>.
    </li>
    <li>
      <strong>Load your vision model</strong> from the model selector at the top of the server view.
    </li>
    <li>
      Enable <strong>"Serve on Local Network"</strong> if you want to reach it from another machine. For local use only,
      leave it off — the default <code className="bg-gray-900/60 px-1 rounded">localhost:1234</code> still works.
    </li>
    <li>
      Make sure <strong>"CORS"</strong> is enabled in the server settings (it is on by default in recent LM Studio versions). Without this the
      browser will block requests.
    </li>
    <li>
      Click <strong>"Start Server"</strong>. The address shown (e.g. <code className="bg-gray-900/60 px-1 rounded">http://localhost:1234</code>) should match
      the Server URL field above — append <code className="bg-gray-900/60 px-1 rounded">/v1</code> here.
    </li>
    <li>
      Click <strong>Test Connection</strong> above, then <strong>↻ Refresh from server</strong> to populate the model list.
    </li>
  </ol>
);

const LlamaCppHelp: React.FC = () => (
  <ol className="mt-2 text-xs text-yellow-100 space-y-2 list-decimal list-inside">
    <li>
      <strong>Build llama.cpp</strong> with server support (most prebuilt releases include <code className="bg-gray-900/60 px-1 rounded">llama-server</code>).
    </li>
    <li>
      <strong>Download a vision model</strong> and its matching <code className="bg-gray-900/60 px-1 rounded">mmproj</code> (multimodal
      projector) file. Look on Hugging Face for GGUF builds — e.g.{' '}
      <code className="bg-gray-900/60 px-1 rounded">Qwen2.5-VL-7B-Instruct-GGUF</code>,{' '}
      <code className="bg-gray-900/60 px-1 rounded">MiniCPM-V-2_6-gguf</code>, or{' '}
      <code className="bg-gray-900/60 px-1 rounded">LLaVA-v1.6-Mistral-7B-GGUF</code>.
    </li>
    <li>
      <strong>Start the server with the vision projector and CORS enabled.</strong> Example:
      <pre className="mt-1 p-2 bg-gray-900/70 rounded text-yellow-200 overflow-x-auto whitespace-pre">
{`./llama-server \\
  -m ./qwen2.5-vl-7b-instruct-q4_k_m.gguf \\
  --mmproj ./qwen2.5-vl-7b-instruct-mmproj-f16.gguf \\
  --host 0.0.0.0 --port 8080 \\
  --ctx-size 8192 \\
  --cors`}
      </pre>
      The <code className="bg-gray-900/60 px-1 rounded">--mmproj</code> flag is what enables image input. The{' '}
      <code className="bg-gray-900/60 px-1 rounded">--cors</code> flag (or{' '}
      <code className="bg-gray-900/60 px-1 rounded">--cors-allow-origin "*"</code> on older builds) is required so the browser will accept the response.
    </li>
    <li>
      The Server URL above should be{' '}
      <code className="bg-gray-900/60 px-1 rounded">http://localhost:8080/v1</code> (note the <code className="bg-gray-900/60 px-1 rounded">/v1</code> suffix).
    </li>
    <li>
      Click <strong>Test Connection</strong> and <strong>↻ Refresh from server</strong>. llama.cpp typically reports the
      loaded model under a single id you can paste into the Model field.
    </li>
    <li>
      If captions come back as text-only nonsense, the projector is not loaded — restart the server with{' '}
      <code className="bg-gray-900/60 px-1 rounded">--mmproj</code>.
    </li>
  </ol>
);

export default ProviderSettings;
