import 'dotenv/config';
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_DISCORD_ID: z.string().optional(),
    AUTH_DISCORD_SECRET: z.string().optional(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // DigitalOcean Spaces configuration
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_ENDPOINT: z.string().optional(),
    // PayPal configuration
    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_SECRET: z.string().optional(),
    PAYPAL_API_URL: z.string().optional(),
    // ChillPay configuration
    CHILLPAY_MERCHANT_CODE: z.string().optional(),
    CHILLPAY_API_KEY: z.string().optional(),
    CHILLPAY_MD5_SECRET: z.string().optional(),
    CHILLPAY_API_ENDPOINT: z.string().optional(),
    // Email configuration
    EMAIL_USER: z.string().optional(),
    EMAIL_PASSWORD: z.string().optional(),
    // S3 Configuration
    AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
    AWS_REGION: z.string().default("sgp1"),
    AWS_ENDPOINT: z.string().default("https://sgp1.digitaloceanspaces.com"),
    AWS_S3_BUCKET: z.string().min(1, "AWS_S3_BUCKET is required"),
    AWS_S3_ROOT_FOLDER: z.string().default("thaiboxinghub"),
    AWS_S3_MAX_FILE_SIZE_KB: z.string().default("120"),
    AWS_S3_MAX_IMAGES: z.string().default("5"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ENDPOINT: process.env.AWS_ENDPOINT,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_SECRET: process.env.PAYPAL_SECRET,
    PAYPAL_API_URL: process.env.PAYPAL_API_URL,
    CHILLPAY_MERCHANT_CODE: process.env.CHILLPAY_MERCHANT_CODE,
    CHILLPAY_API_KEY: process.env.CHILLPAY_API_KEY,
    CHILLPAY_MD5_SECRET: process.env.CHILLPAY_MD5_SECRET,
    CHILLPAY_API_ENDPOINT: process.env.CHILLPAY_API_ENDPOINT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ENDPOINT: process.env.AWS_ENDPOINT,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_S3_ROOT_FOLDER: process.env.AWS_S3_ROOT_FOLDER,
    AWS_S3_MAX_FILE_SIZE_KB: process.env.AWS_S3_MAX_FILE_SIZE_KB,
    AWS_S3_MAX_IMAGES: process.env.AWS_S3_MAX_IMAGES,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
