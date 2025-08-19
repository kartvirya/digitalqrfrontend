// Centralized environment configuration for the frontend
// Ensures a single place to read environment variables

export const BACKEND_URL: string | undefined = process.env.REACT_APP_BACKEND_URL as string | undefined;

export const FRONTEND_URL: string = (
  (process.env.REACT_APP_FRONTEND_URL as string | undefined) || window.location.origin
);


