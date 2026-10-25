# Garage Management System

A Node.js/Express backend for managing car services, customers, users, and reminders for a garage business. The system supports authentication, car and customer management, service tracking, image uploads to AWS S3, WhatsApp and email notifications, and more.

## Features

- **User Authentication:** Admin-only login, JWT-based authentication, password reset via email.
- **Customer Management:** Create, update, delete, and search customers; view recent and paginated customers.
- **Car Management:** Add, update, delete cars; upload and compress car images; associate cars with customers.
- **Service Management:** Track car services, costs, due dates, and revenue; paginate and filter services.
- **Image Handling:** Upload and compress images, store in AWS S3, send images via WhatsApp.
- **Notifications:** WhatsApp reminders for service due dates, email OTP for password reset.
- **Database:** PostgreSQL with Sequelize ORM and migrations.
- **Cron Jobs:** Automated daily reminders for upcoming services.
- **Environment Config:** Separate `.env` files for development and production.

## Project Structure

```
src/
  config/           # Configuration files (DB, S3, nodemailer)
  controllers/      # Express route controllers
  cron/             # Scheduled jobs (e.g., reminders)
  middleware/       # Express middlewares (auth, upload)
  migrations/       # Sequelize migrations
  models/           # Sequelize models
  routes/           # Express route definitions
  seeders/          # (Empty) For future data seed scripts
  services/         # Service modules (email, S3)
  utils/            # Utility functions (SMS, code generation)
  .env.development  # Development environment variables
  .env.production   # Production environment variables
  package.json      # Project dependencies and scripts
  server.js         # Main Express server entry point
  readme.md         # Project documentation
```

## Setup & Installation

1. **Clone the repository:**

   ```sh
   git clone <repo-url>
   cd <project-directory>/src
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment:**

   - Copy `.env.development` and `.env.production` as needed.
   - Set your database, AWS, email, and WhatsApp API credentials.

4. **Run database migrations:**

   ```sh
   npx sequelize-cli db:migrate
   ```

5. **Start the server:**
   - Development:
     ```sh
     npm run dev
     ```
   - Production:
     ```sh
     npm start
     ```

## API Endpoints

- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/forgotpassword`, `/api/auth/verifyotp`, `/api/auth/resetpassword`, `/api/auth/logout`
- **Users:** `/api/users/getall`, `/api/users/deleteuser/:id`
- **Customers:** `/api/customers/create`, `/api/customers/getall`, `/api/customers/get/:id`, `/api/customers/update/:id`, `/api/customers/delete/:id`, etc.
- **Cars:** `/api/cars/create`, `/api/cars/getall`, `/api/cars/:id`, `/api/cars/upload-images/:carId`, etc.
- **Services:** `/api/services/create`, `/api/services/getall`, `/api/services/get/:id`, `/api/services/update/:id`, etc.

## Technologies Used

- Node.js, Express.js
- PostgreSQL, Sequelize ORM
- AWS S3 (image storage)
- Nodemailer (email)
- WhatsApp Cloud API (reminders, image sending)
- JWT (authentication)
- Multer & Sharp (image upload/compression)
- node-cron (scheduled jobs)

## License

MIT

---
