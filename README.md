# Graph X-Ray: Web App

A browser-based version of [Graph X-Ray](https://github.com/merill/graphxray/) — the tool that reveals the Microsoft Graph API calls behind admin portal actions and converts them into ready-to-use code snippets.

This version runs **entirely in the browser** with no extension required. Instead of intercepting live network traffic, you export a HAR file from your browser's DevTools and drop it in.

## How it works

1. Open the Microsoft admin portal (Entra, Intune, etc.) in your browser
2. Open **DevTools → Network** tab
3. Perform the action you want to script
4. Export the network log: **right-click → Save all as HAR with content**
5. Drop the `.har` file into Graph X-Ray Web

Graph X-Ray will parse the HAR file, extract all Microsoft Graph API calls, and generate code snippets for each one.

## Features

- **No extension needed** — works in any browser, on any OS
- **Instant script generation** from HAR files
- **Multi-language support**: PowerShell, Python, C#, JavaScript, Go, Java, Objective-C
- **Batch request support** — `/$batch` requests are expanded into individual snippets
- **Ultra X-Ray mode** — also captures internal/undocumented Microsoft API calls
- **Save script** — export all snippets as a single file

## Supported Graph endpoints

- `graph.microsoft.com` (Public cloud)
- `graph.microsoft.us` (US Government — GCC High)
- `dod-graph.microsoft.us` (US Department of Defense)
- `microsoftgraph.chinacloudapi.cn` (China cloud)

## Development

```
npm install
npm run dev       # Start dev server
npm run build     # Type-check and production build
npm run preview   # Preview production build
```

Requires [mise](https://mise.jdx.dev/) — use `mise exec -- npm run dev` if using the project's tool versions.

## Credits

Based on [Graph X-Ray](https://github.com/merill/graphxray/) by [@merill](https://github.com/merill) and contributors, originally created as a hackathon project by Eunice, Dhruv, Clement, Monica & Merill.

Code snippet generation powered by the [Microsoft Graph DevX API](https://devxapi-func-prod-eastus.azurewebsites.net).

## Feedback

Please report issues at [github.com/merill/graphxray/issues](https://github.com/merill/graphxray/issues).
