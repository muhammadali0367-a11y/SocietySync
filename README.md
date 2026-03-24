# SocietySync - Automated Billing for Housing Societies

A lightweight, automated billing and recovery portal designed for housing society management in Pakistan.

## Features

- **Automated Invoicing**: Generate and distribute digital invoices with QR codes for EasyPaisa, JazzCash, and bank transfers
- **Auto-Reconciliation**: Upload bank statements (CSV) and automatically match transactions to pending invoices
- **Defaulter Automation**: Automatically restrict gate entry for defaulters and send payment reminders
- **Gate Entry System**: QR code-based gate entry verification with real-time logging
- **Dashboard**: Real-time recovery rates, collection stats, and society overview
- **Resident Management**: Full CRUD for residents with status tracking

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **QR Codes**: `qrcode` library for payment and gate entry QR generation

## Project Structure

```
SocietySync/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/models.py     # Database models
│   │   ├── schemas/schemas.py   # Pydantic schemas
│   │   ├── routers/             # API route handlers
│   │   │   ├── societies.py
│   │   │   ├── residents.py
│   │   │   ├── invoices.py
│   │   │   ├── payments.py
│   │   │   ├── gate.py
│   │   │   └── dashboard.py
│   │   └── services/            # Business logic
│   │       ├── invoice_service.py
│   │       ├── qr_service.py
│   │       ├── reconciliation_service.py
│   │       └── notification_service.py
│   ├── seed.py                  # Sample data seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── residents/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── defaulters/
│   │   │   ├── gate/
│   │   │   └── settings/
│   │   ├── components/          # Shared UI components
│   │   └── lib/                 # API client & utilities
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Seed sample data (optional)
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: http://localhost:3000

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/dashboard/{society_id}` | Dashboard stats |
| `GET/POST /api/societies/` | Society CRUD |
| `GET/POST /api/residents/` | Resident management |
| `POST /api/invoices/bulk` | Bulk invoice generation |
| `POST /api/invoices/check-overdue` | Check & mark overdue invoices |
| `POST /api/payments/` | Record manual payment |
| `POST /api/payments/reconcile` | Upload bank statement for auto-reconciliation |
| `POST /api/gate/verify` | Gate entry verification |
| `GET /api/gate/logs` | Gate activity logs |

## Business Model

- Monthly management fee per household (e.g., Rs. 50/house/month)
- 500 houses = Rs. 25,000/month recurring revenue
- Start with one private society, scale across Punjab

## Reconciliation Strategies

The auto-reconciliation engine uses three matching strategies:
1. **Invoice Number Match** (High confidence): Finds invoice number in bank description
2. **House Number + Amount** (Medium confidence): Matches house number in description with exact amount
3. **Name + Amount** (Medium confidence): Matches resident name with exact amount

High-confidence matches are auto-applied. Medium/low require manual review.
