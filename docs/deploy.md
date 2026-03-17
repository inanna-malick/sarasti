# Deployment Guide

This document outlines the deployment process for The Tidal Scream.

## Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare API Token with `Workers`, `KV`, and `Pages` permissions.
- Cloudflare Account ID.

## Setup

1.  **Create KV Namespace**:
    The application uses Cloudflare KV to cache market data.
    ```bash
    wrangler kv:namespace create MARKET_DATA
    ```
    Note the ID returned and update `wrangler.toml`.

2.  **Configure GitHub Secrets**:
    Add the following secrets to your GitHub repository:
    - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token.
    - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.

3.  **Configure Production Environment**:
    In GitHub repository settings, create an environment named `production` to match the CI/CD workflow.

## Deployment

### Manual Deployment

You can deploy manually from your local machine:

1.  **Generate FLAME assets**:
    Ensure `.bin` files are present in `public/data/`. These are usually gitignored.
    ```bash
    npm run extract-flame
    ```

2.  **Build the project**:
    ```bash
    npm run build
    ```

3.  **Deploy**:
    ```bash
    npm run deploy
    ```

### CI/CD Deployment

Pushing to the `main` branch triggers the GitHub Actions workflow:
1.  **Build and Test**: Runs type checks, tests, and builds the project.
2.  **Deploy**: If the build succeeds, it automatically deploys to Cloudflare using the `wrangler-action`.

## Notes on FLAME .bin Files

FLAME `.bin` files are binary assets required by the renderer. They are excluded from version control to keep the repository size manageable.
- **Local development**: Run `npm run extract-flame` to generate them.
- **CI/CD**: The build job will warn if no `.bin` files are found. If your deployment requires these files, ensure they are either included in the build or downloaded during the CI process.
