# MicroMart – Microservices Management Platform

A full-stack CRUD application for demonstrating AWS DevOps workflows.

## Architecture
- React + Vite frontend
- Nginx reverse proxy / static web server
- Flask User, Product and Order microservices
- Separate SQLite database per service (persistent Docker volumes)
- Docker Compose orchestration

## Features
- Dashboard with user, product, order and revenue summaries
- Full create/read/update/delete for users, products and orders
- Search and order-status filtering
- Responsive admin interface

## Run locally with Docker
Requirements: Docker Engine and Docker Compose plugin.

```bash
docker compose up --build -d
docker compose ps
```

Open http://localhost

API endpoints:
- `GET/POST /api/users`
- `GET/PUT/DELETE /api/users/<id>`
- `GET/POST /api/products`
- `GET/PUT/DELETE /api/products/<id>`
- `GET/POST /api/orders`
- `GET/PUT/DELETE /api/orders/<id>`

Health endpoints:
- `/api/users/health`
- `/api/products/health`
- `/api/orders/health`

## Sample workflow
1. Add a user from Customers.
2. Add a product from Products.
3. Create an order using the user and product IDs.
4. Change the order status.
5. Review dashboard totals.

## DevOps notes
- The three services have separate SQLite files and Docker named volumes.
- SQLite is appropriate for this compact assignment demo. For a production workload, use managed databases and backups.
- For AWS, build and push the frontend gateway and three service images to ECR, then deploy with Compose on EC2.
- Keep credentials and Terraform state out of Git. Use IAM roles and restricted security groups.
