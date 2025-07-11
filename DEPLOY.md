# 🚀 Deploy Delta Chat to Vercel

## Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from this directory
```bash
vercel --prod
```

## Alternative: GitHub Integration

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial Delta Chat commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect the settings
6. Click "Deploy"

## Environment Variables (if needed)
- `NODE_ENV=production` (auto-set by Vercel)
- `PORT` (auto-set by Vercel)

## After Deployment

Your app will be available at: `https://your-project-name.vercel.app`

Share this URL with your friends to use Delta Chat!

## Features Available
✅ Real-time chat
✅ Room creation/joining
✅ Collaborative canvas with tools
✅ File sharing (images, documents)
✅ Touch support for mobile
✅ Undo/Redo functionality
✅ Multiple drawing tools
✅ Export canvas as image

## Custom Domain (Optional)
1. Go to your project dashboard on Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS setup instructions

## Troubleshooting
- If Socket.IO doesn't work, check CORS settings in `index.js`
- For file upload issues, check Vercel function limits (50MB max)
- Canvas data is not persisted (refreshing clears it)

Enjoy your Delta Chat! 🎉
