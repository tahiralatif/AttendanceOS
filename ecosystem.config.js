module.exports = {
  apps: [
    {
      name: 'aos-backend',
      cwd: '/root/.openclaw/workspace/AttendanceOS/backend',
      script: 'venv/bin/python3',
      args: '-m uvicorn app.main:app --host 127.0.0.1 --port 8006',
      env: {
        DATABASE_URL: 'postgresql+asyncpg://attendanceos:attendanceos123@localhost:5432/attendanceos',
        REDIS_URL: 'redis://localhost:6379/1',
        JWT_SECRET_KEY: 'aos-super-secret-jwt-key-2026-change-in-prod',
        SECRET_KEY: 'aos-super-secret-key-2026-change-in-prod',
      },
      max_memory_restart: '256M',
    },
    {
      name: 'aos-frontend',
      cwd: '/root/.openclaw/workspace/AttendanceOS/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3006',
      env: {
        PORT: '3006',
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
    },
  ],
};
