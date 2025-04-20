# Muay Thai One

A comprehensive management system for Muay Thai events, venues, and training courses.

## Features

- **Event Management**: Create, update, and manage events with ticket types and pricing
- **Venue Management**: Manage venues and associate them with regions
- **Training Courses**: Offer and manage training courses with instructor information
- **Recurring Events**: Define event templates that generate events automatically on a schedule
- **Automated Event Generation**: Cron job system that creates upcoming events based on templates
- **Booking System**: Allow customers to book tickets for events
- **Course Enrollment**: Manage student enrollments in training courses
- **Region-based Organization**: Organize content by geographic regions

## Technology Stack

- [Next.js](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [date-fns](https://date-fns.org/) - Date handling

## Getting Started

### Prerequisites

- Node.js 16.14.0 or later
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by copying `.env.example` to `.env` and filling in the values:
   ```bash
   cp .env.example .env
   ```
4. Initialize the database schema:
   ```bash
   npm run db:push
   ```
5. Seed the database with initial data (optional):
   ```bash
   npm run db:seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## Recurring Events System

The application includes a recurring events system that automatically generates events based on templates.

### Event Templates

Event templates define:
- Venue and region
- Default title format and description
- Recurrence pattern (weekly/monthly)
- Default start/end times
- Default ticket types and pricing

### Automated Event Generation

A cron job system automatically creates upcoming events based on active templates:

1. API endpoint: `/api/cron/generate-events`
2. Configured to run daily via Vercel cron jobs (see `vercel.json`)
3. Protected via `CRON_SECRET` environment variable
4. Generates events for the next 30 days by default

For more details on the cron system, see [the cron documentation](./src/app/api/cron/README.md).

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com). The configuration includes automated cron jobs for event generation.

1. Connect your GitHub repository to Vercel
2. Set up environment variables in the Vercel dashboard
3. Deploy

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio to inspect database
- `npm run lint` - Run ESLint
- `npm run format:write` - Format code with Prettier

## License

This project is licensed under the [MIT License](LICENSE).
