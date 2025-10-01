
import fs from 'fs';

function loadEnv(){
  const env = process.env;
  return {
    JWT_SECRET: env.JWT_SECRET || 'dev-secret',
    PORT: parseInt(env.PORT || '3001', 10),
    DATABASE_FILE: env.DATABASE_FILE || './data.db',
    CLIENT_ORIGIN: env.CLIENT_ORIGIN || 'http://localhost:5173',
  };
}
export const config = loadEnv();
