# Decentralized Raffle Protocol

A Next.js 14 application demonstrating a decentralized raffle experience with RainbowKit and wagmi.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

   If you hit `403 Forbidden` errors while fetching packages (often caused by
   strict proxy settings), clear any proxy-related environment variables and
   retry with explicit proxy overrides:

   ```bash
   unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy
   npm install --registry=https://registry.npmjs.org --proxy=null --https-proxy=null
   ```

2. Create a `.env.local` file (or copy `.env.example`) with your WalletConnect Cloud project ID (required by RainbowKit connectors):

   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_cloud_id
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

## Deployment

For Vercel deployments, add `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to the project Environment Variables. The build will fail if the variable is missing, ensuring WalletConnect is correctly configured.

The app enables strict mode and security headers (CSP, HSTS, Referrer-Policy, X-Frame-Options, and X-Content-Type-Options) via `next.config.js` to harden the UI against common attacks.

## Saving your changes to GitHub

1. Check which files changed:

   ```bash
   git status -sb
   ```

2. Stage and commit the updates:

   ```bash
   git add .
   git commit -m "Describe your change"
   ```

3. Push to your GitHub repository (replace `work` with your branch name if different):

   ```bash
   git push origin work
   ```
