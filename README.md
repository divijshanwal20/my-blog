# Blog Starter (React + Vite + Tailwind)

A zero-backend mini blog where you can write, preview, and publish posts (stored in your browser). Ready for Vercel deployment.

## Local run (optional)
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Create a new GitHub repo and upload these files.
2. Go to https://vercel.com → **Add New Project** → **Import** your repo.
3. Framework preset: **Vite** (auto-detected). Build command: `npm run build`. Output dir: `dist`.
4. Click **Deploy** → you'll get `yourname.vercel.app`.

## Notes
- Posts are saved to localStorage in the browser.
- Use **Export** to download a JSON backup, and **Import** to restore.
