# Sweety – Blood Glucose Tracker

A full-stack web application for recording and monitoring daily blood glucose readings. Sweety allows users to securely manage their readings and view daily and monthly summaries.

## Features

- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- User-specific glucose records.
- Add, view, edit and delete glucose readings.
- Four daily reading slots:
  - Morning
  - After breakfast
  - After lunch
  - After dinner
- Glucose value validation (40–600 mg/dL).
- Prevention of duplicate time slots on the same date.
- Maximum of four readings per day.
- Prevention of future-dated readings.
- Daily, month-to-date and previous-month reports.
- Highest, lowest, average and total reading statistics.

## Technology Stack

**Frontend:** React.js, Vite, CSS, Axios, Lucide React

**Backend:** Node.js, Express.js, PostgreSQL, JWT, bcrypt

**Testing and Tools:** Node.js built-in test runner, Git, GitHub, Postman

## Project Structure

```text
sweety-blood-glucose-tracker/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   │   └── schema.sql
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   │   └── seed.js
│   ├── tests/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Meghsinfinity/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker
```

### 2. Create the PostgreSQL database

Open PostgreSQL SQL Shell (psql) and connect using your PostgreSQL credentials.

Execute:

```sql
CREATE DATABASE sweety_db;
```

### 3. Create database tables

From the project root, run:

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d sweety_db -f server/database/schema.sql
```

Enter your PostgreSQL password when prompted.

### 4. Configure environment variables

Navigate to the `server` folder:

```bash
cd server
```

Create your local `.env` file by copying `.env.example`.

On PowerShell:

```powershell
Copy-Item .env.example .env
```

On Git Bash:

```bash
cp .env.example .env
```

Update the `.env` file with your PostgreSQL credentials and a secure JWT secret.

Example configuration:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=sweety_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
JWT_SECRET=your_random_secret_at_least_32_characters
JWT_EXPIRES_IN=1d
BCRYPT_ROUNDS=12
CLIENT_ORIGIN=http://localhost:5173
```

Generate a secure JWT secret using:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `JWT_SECRET`.

Keep the `.env` file private. Do not upload it to GitHub.

### 5. Install backend dependencies

While inside the `server` directory:

```bash
npm install
```

### 6. Seed the database

Run the following command inside the `server` directory:

```bash
npm run seed
```

This creates a demo user and four sample glucose readings dated yesterday. The seed script can be run again without creating duplicate demo readings for the same date and slots.

**Demo login credentials:**

- Email: `demo@sweety.com`
- Password: `SweetyDemo@123`

### 7. Install frontend dependencies

Open another terminal at the project root:

```bash
cd client
npm install
```

## Running the Application

### Start the backend

From the `server` directory:

```bash
npm run dev
```

Backend URL: http://localhost:5000

### Start the frontend

From the `client` directory, in a separate terminal:

```bash
npm run dev
```

Frontend URL: http://localhost:5173

Open the frontend URL in your browser.

## Testing

Run backend automated tests:

```bash
cd server
npm test
```

Create a production build of the frontend:

```bash
cd client
npm run build
```

## Security and Validation

- Passwords are hashed using bcrypt.
- Protected API endpoints require JWT authentication.
- Users can access only their own readings.
- Duplicate daily time slots are prevented.
- Glucose readings must be whole numbers between 40 and 600 mg/dL.
- Future dates and invalid calendar dates are rejected.
- Database constraints enforce data integrity.

## Reports

Sweety provides three reporting periods:

- **Daily:** Readings for a selected date.
- **Month-to-date:** Readings from the beginning of the selected month through the selected date.
- **Previous month:** Readings for the previous calendar month.

Reports include the highest, lowest, average and total number of readings.

## Notes

### Assumptions

- Each user can record a maximum of four readings per day, one for each predefined time slot.
- Glucose values are recorded as whole numbers in mg/dL.
- Readings cannot be entered for future dates.
- Each reading belongs to the authenticated user.
- The demo account and sample readings are provided for testing purposes.

### Future Improvements

With additional development time, the application could be enhanced with:

- Interactive glucose trend charts and visual analytics.
- Exporting readings and reports as PDF or CSV.
- Customizable glucose thresholds and alerts.
- Password reset and email verification.
- Improved mobile responsiveness and accessibility.
- Automated deployment and continuous integration.

## Disclaimer

Sweety is a personal glucose tracking application intended to help users maintain records. It is not a medical diagnostic tool and does not replace professional medical advice.