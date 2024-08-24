A simple example for setting up subscriptions using stripe-payment links

watch the tutorial here -> https://www.youtube.com/watch?v=mLSnVg7YvIY

## Getting Started:

Prepare DB: 

```bash
# Have a postgresql database running using postgres.app 
# and add the DATABASE_URL `(eg: postgresql://localhost:5432/postgres)`
# in your `.env.local` file

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
