# AI-Powered Digital Banking Platform

A production-ready, industry-standard, fully functional, and secure **AI-Powered Digital Banking Platform** built using Java Full Stack (Spring Boot + Security + JWT), React.js (Tailwind CSS + Recharts), and Python (Flask + Scikit-Learn + Gemini API). 

This platform showcases modern banking workflows (balances, deposits, withdrawals, atomic transfers), administrative dashboard oversight (approving/rejecting accounts, freezing customers), an automated machine-learning **AI Fraud Detection System**, and an **AI Financial Assistant** chatbot.

---

## Technical Stack

* **Backend**: Java 21, Spring Boot 3.3, Spring Security, JWT (JSON Web Tokens), Spring Data JPA, Hibernate, Maven, OpenPDF (for statement generation), SpringDoc OpenAPI (Swagger).
* **Frontend**: React.js, Tailwind CSS, Axios, Lucide React (Icons), Recharts (Interactive charting).
* **AI Engine**: Python 3.10, Flask REST API, Scikit-Learn (Random Forest Classification), Google GenAI SDK (Gemini API for assistant queries).
* **Database**: MySQL 8.0.
* **DevOps**: Docker, Docker Compose.

---

## Directory Architecture

```text
digital-banking-platform/
├── database/
│   └── schema.sql                  # Database DDL initialization script
├── backend/                        # Java Spring Boot API Gateway
│   ├── src/main/java/com/banking/  # Controller-Service-Repository implementation
│   ├── src/main/resources/         # Configuration (application.yml)
│   ├── pom.xml                     # Maven dependency config
│   └── Dockerfile                  # Multi-stage Java build
├── frontend/                       # React client
│   ├── src/                        # Pages, Components, and Axios API Client
│   ├── tailwind.config.js          # Tailwind theme configs
│   ├── nginx.conf                  # Nginx proxy mapping to backend API
│   ├── package.json                # Front-end dependencies
│   └── Dockerfile                  # Multi-stage static build
├── ai-service/                     # Python Flask microservice
│   ├── app.py                      # Flask API endpoints
│   ├── fraud_model.py              # ML classifier training and prediction logic
│   ├── requirements.txt            # Python packages
│   └── Dockerfile                  # Flask containerization setup
└── docker-compose.yml              # Root multi-container orchestration
```

---

## Core API Endpoints

### 1. Authentication (`/api/auth`)
* `POST /api/auth/register`: Create a new customer profile.
* `POST /api/auth/login`: Verify credentials and retrieve a JWT authorization token.
* `GET /api/auth/me`: Get profile data for the authenticated session.

### 2. Customer Services (`/api/customer`)
* `POST /api/customer/accounts`: Request opening a new SAVINGS or CURRENT account (default: PENDING).
* `GET /api/customer/accounts`: Fetch list of owned accounts.
* `GET /api/customer/accounts/{accountNumber}`: Fetch details for a specific account.
* `POST /api/customer/transactions`: Execute transfers, withdrawals, or deposits. Enforces AI fraud checks.
* `GET /api/customer/transactions`: Fetch transaction history.
* `GET /api/customer/accounts/{accountNumber}/statement`: Download styled PDF statement ledger.
* `GET /api/customer/notifications`: List all notifications.
* `PUT /api/customer/notifications/read-all`: Mark all notifications as read.
* `POST /api/customer/chat`: Query the AI financial assistant.

### 3. Administrative Console (`/api/admin`)
* `GET /api/admin/analytics`: Fetch metrics (total deposits, pending approvals, active fraud alerts).
* `GET /api/admin/customers`: List all customer registry profiles.
* `PUT /api/admin/customers/{id}/freeze`: Block a customer profile from logging in.
* `PUT /api/admin/customers/{id}/unfreeze`: Restore customer profile login capabilities.
* `GET /api/admin/accounts`: List all system accounts.
* `PUT /api/admin/accounts/{id}/approve`: Approve a pending account opening.
* `PUT /api/admin/accounts/{id}/reject`: Reject a pending account opening.
* `PUT /api/admin/accounts/{accountNumber}/freeze`: Freeze transfers on a specific account.
* `GET /api/admin/transactions`: Monitor all transactions.
* `GET /api/admin/fraud-alerts`: Track active fraud alerts and risk scores.
* `PUT /api/admin/fraud-alerts/{id}/resolve`: Resolve fraud alert status (RESOLVED/INVESTIGATED).
* `GET /api/admin/audit-logs`: View platform security audit trails.

---

## Default Seed Credentials

During startup, the application seeder automatically configures these profiles for immediate testing:

1. **System Administrator**:
   * **Username**: `admin`
   * **Password**: `admin123`
   * **Role**: `ROLE_ADMIN`
2. **Standard Customer**:
   * **Username**: `customer`
   * **Password**: `customer123`
   * **Role**: `ROLE_CUSTOMER`
   * **Pre-created Account**: `1009876543` (Active Savings, initial balance `$5,000.00`)

---

## Quick Setup & Execution

### Option A: Using Docker Compose (Recommended)
1. Ensure Docker Desktop is running.
2. In the root directory, configure the Gemini API key in `docker-compose.yml` under `ai-service` environment. (If not configured, the chatbot falls back to the local rule-based system).
3. Start the application:
   ```bash
   docker-compose up --build
   ```
4. Access:
   * **Frontend Dashboard**: `http://localhost:3000`
   * **Backend REST API**: `http://localhost:8080`
   * **Swagger API Documentation**: `http://localhost:8080/swagger-ui.html`
   * **AI Flask Microservice**: `http://localhost:5000`

### Option B: Local Manual Setup (Without Docker)

#### 1. Database Setup
Create database `digital_banking` in MySQL and execute scripts in `database/schema.sql` to initialize tables.

#### 2. AI Python Service
1. Navigate to `/ai-service`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run model training:
   ```bash
   python fraud_model.py
   ```
4. Start Flask server:
   ```bash
   python app.py
   ```

#### 3. Backend Setup
1. Navigate to `/backend`.
2. Edit `src/main/resources/application.yml` with your local MySQL credentials.
3. Build and execute:
   ```bash
   mvn clean spring-boot:run
   ```

#### 4. Frontend Setup
1. Navigate to `/frontend`.
2. Install packages:
   ```bash
   npm install
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```
4. Navigate browser to `http://localhost:3000`.
