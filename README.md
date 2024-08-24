A simple example for setting up subscriptions using stripe-payment links

## Getting Started:

Prepare DB: 

- Have a postgresql database running using postgres.app and add the DATABASE_URL `(eg: postgresql://localhost:5432/postgres)` in your `.env.local` file
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

## database ui
npm run db:ui
```

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
