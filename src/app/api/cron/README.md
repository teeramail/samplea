# Cron Jobs

This directory contains API routes that can be triggered by external cron job services to perform scheduled tasks.

## Event Generation Cron Job

The event generation cron job automatically creates new events based on event templates. It uses the recurring patterns defined in each template to generate events for the specified number of days into the future.

### Endpoint

`GET /api/cron/generate-events`

### Authentication

The endpoint is protected with a secret key. You must include the secret in the `Authorization` header:

```
Authorization: Bearer YOUR_CRON_SECRET
```

### Parameters

- `days` (optional): Number of days to look ahead when generating events (default: 30)

### Environment Variables

Add the following to your `.env` file:

```
CRON_SECRET=your_secure_random_string
```

Make sure to use a strong, randomly generated string for security.

### Setting Up External Cron Service

#### Option 1: Vercel Cron Jobs

If your application is deployed on Vercel, you can use their built-in cron job functionality.

1. Add this to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-events",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This will run the job every day at midnight.

2. Make sure to set the `CRON_SECRET` environment variable in your Vercel project settings.

#### Option 2: GitHub Actions

If you prefer using GitHub Actions:

1. Create a file `.github/workflows/cron.yml`:

```yaml
name: Daily Event Generation

on:
  schedule:
    - cron: '0 0 * * *'  # Runs at midnight every day

jobs:
  generate-events:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger event generation
        run: |
          curl -X GET "https://yourdomain.com/api/cron/generate-events" \
          -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

2. Add your `CRON_SECRET` to GitHub repository secrets.

#### Option 3: External Cron Service (like Cron-job.org or EasyCron)

1. Create an account with a cron service provider
2. Set up a new cron job to make a GET request to your endpoint
3. Schedule it to run daily (or at your preferred frequency)
4. Add the Authorization header with your secret

### Testing

To test the cron job locally:

```bash
curl -X GET "http://localhost:3000/api/cron/generate-events?days=14" \
-H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Logs

The cron job logs its activity to the console, which can be viewed in your server logs. Look for log messages prefixed with `[CRON]`. 