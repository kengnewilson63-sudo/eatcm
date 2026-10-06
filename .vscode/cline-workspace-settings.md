Cline workspace settings (placeholder)

Drop these into your workspace settings (`.vscode/settings.json`) or into the saved `.code-workspace` `settings` section.

Do NOT put API keys directly here; use VS Code Secret Storage or the extension's built-in key UI.

Example (replace provider/model names with what the extension documents):

```json
{
  "cline.agent.enabled": true,
  "cline.provider": "openai",
  "cline.model": "gpt-4o-code",
  "cline.timeoutMs": 60000,
  "cline.autoApproveRequests": false
}
```

How to store API keys securely

- Open Command Palette and search for "Preferences: Open Settings (UI)" then search "Cline" and use the provided key input.
- Or open the extension's UI (Cline view) and follow prompts to add the API key to VS Code Secret Storage.

If you give me the filesystem path to your Spring Boot repo, I will add it to `eatscm2.code-workspace` so both projects open together.
