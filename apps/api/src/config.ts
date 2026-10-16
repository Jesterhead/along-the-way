function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env['PORT'] ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  localUserEmail: process.env['LOCAL_USER_EMAIL'] ?? 'local@along-the-way.dev',
};
