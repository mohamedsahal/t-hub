# T-Hub Innovation Platform

## Deployment on Render

This application is configured for deployment on Render.com using the `render.yaml` blueprint.

### Deployment Steps

1. Push your code to GitHub
2. In Render dashboard, select "New Blueprint" and connect to your repository
3. Render will automatically create:
   - A web service for the application
   - A PostgreSQL database

### Environment Variables

The necessary environment variables are defined in the `render.yaml` file. You'll need to manually set:

- `EMAIL_PASSWORD`: Set this in the Render dashboard (it's configured as a secret)

### Troubleshooting

If you encounter the "Missing build directory" error:
- Make sure the build completes successfully
- Check that paths in `server/vite.ts` correctly point to the build output directory

If you encounter database connection errors:
- Ensure the PostgreSQL service is provisioned correctly on Render
- Verify that `DATABASE_URL` is properly configured

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a local PostgreSQL database
4. Create a `.env` file based on the example
5. Run the development server: `npm run dev`

## Build

```
npm run build
```

This builds both the client and server components. 