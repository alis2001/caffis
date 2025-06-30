# ☕ Caffis

A social-first platform that connects people over spontaneous coffee meetups and events.

## 🧱 Tech Stack

- **Frontend:** Next.js 15 + Tailwind CSS (in `client/`)
- **Backend:** Node.js + Express (in `server/`)
- **Database:** PostgreSQL (Dockerized)
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **Validation:** express-validator
- **DevOps:** Docker Compose
- **Planned:** Socket.IO for real-time messaging

---

## 🚀 Getting Started (Local Dev)

### ✅ Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/compose/install/)
- Node.js 18+ (only needed if you want Prisma CLI locally)

### 📦 Installation

```bash
git clone https://github.com/alis2001/caffis.git
cd caffis
cp .env.example .env     # Add your secrets
docker-compose up --build




# Caffis — Social Invitation Platform

## ✅ Current Backend Features (Node.js + Express + Prisma)
- Authentication (Register, Login, JWT)
- Input validation with express-validator
- Middleware for token protection
- Invites: Create, View (Public + My Invites)
- Request to join invite
- Prisma PostgreSQL schema
- Dockerized setup

## 🚀 How to Run
```bash
docker-compose up --build
