## Portfolio Site

This is a Vite + React portfolio site.

### Local development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

### Deployment flow (Vercel)

1. **Initialize git in the `portfolio-site` folder** (already done if you are using this repo).
2. **Commit your changes**:
   - If you have not configured git yet, run this once with your details:
     ```bash
     git config --global user.name "Your Name"
     git config --global user.email "you@example.com"
     ```
   - Then commit:
     ```bash
     git add .
     git commit -m "Initial commit"
     ```
3. **Create an empty GitHub repository** (no README/License) and copy its URL.
4. **Connect the local repo to GitHub and push**:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```
5. **Deploy with Vercel**:
   - Go to https://vercel.com and log in.
   - Click **“Add New → Project”**, choose **“Import Git Repository”**, and select this repo.
   - Framework preset: **Vite**.
   - Build command: `npm run build`.
   - Output directory: `dist`.
   - Keep root directory as the repo root.
   - Finish the setup and wait for the deployment to complete.
6. **Verify the live site**:
   - Open the `*.vercel.app` URL Vercel gives you.
   - Check that the hero section renders, the globe animation appears, and there are no errors in the browser console.

