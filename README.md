# D1 Read Replica with Hono

A Cloudflare Workers application built with Hono that demonstrates D1 database's [global read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/) functionality for an e-commerce application.

## Live Demo

[Live Demo](https://d1-read-replica-hono.employee-account-d41.workers.dev/)

## Quickstart

1. Click on the button below to deploy the application to Cloudflare Workers:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/harshil1712/e-com-d1-hono)

2. Enable Read Replication:

```bash
# Enable Read replication
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"read_replication": {"mode": "auto"}}'

```


## Features

- RESTful API endpoints for product management
- D1 database integration with read replica support
- Session-based database operations
- Efficient product updates with partial modifications

## Prerequisites

- Node.js installed on your system
- Cloudflare account

## Get Started

1. Clone the repository:
```bash
git clone https://github.com/harshil1712/e-com-d1-hono.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a D1 database:
```bash
# Create a new D1 database
npx wrangler d1 create <DATABASE_NAME>
```

4. Update `wrangler.jsonc` with the database binding:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "<DATABASE_NAME>",
      "database_id": "<DATABASE_ID>"
    }
  ]
}
```

5. Enable Read replication:
```bash
# Enable Read replication
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"read_replication": {"mode": "auto"}}'
```

6. Run the development server:
```bash
# Run the development server with remote D1
npm run dev
```

7. Deploy to Cloudflare Workers:
```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## API Endpoints

- `GET /api/products` - Retrieve all products
- `GET /api/products/:id` - Retrieve a specific product
- `POST /api/products` - Upsert a product

## Project Structure

```
├── src/
│   └── index.ts    # Main application code
├── public/
│   └── index.html    # Product listing page
│   └── product-details.html    # Product details page
├── package.json    # Project dependencies
└── wrangler.jsonc  # Cloudflare Workers configuration
```

## Technologies Used

- [Hono](https://hono.dev/) - Fast, Lightweight, Web-standards Web Framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [D1 Database](https://developers.cloudflare.com/d1/) - SQLite database at the edge

## Type Generation

To update TypeScript types for Cloudflare bindings:

```bash
npm run cf-typegen
```

## Contribution

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License

