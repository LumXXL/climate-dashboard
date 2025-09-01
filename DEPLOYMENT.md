# 🚀 Deployment Guide

This guide will walk you through deploying your Climate Dashboard to GitHub Pages (frontend) and an external service (backend).

## 📋 Prerequisites

- GitHub account
- OpenAI API key
- Node.js 18+ installed locally

## 🌐 Step 1: Push to GitHub

### 1.1 Initialize Git Repository
```bash
cd climate-dashboard
git init
git add .
git commit -m "Initial commit: Climate Dashboard with AI scenarios"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name it `climate-dashboard`
4. Make it public (required for free GitHub Pages)
5. Don't initialize with README (we already have one)

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/yourusername/climate-dashboard.git
git branch -M main
git push -u origin main
```

## 🎨 Step 2: Deploy Frontend to GitHub Pages

### 2.1 Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. Click **Configure** button

### 2.2 Verify Deployment
- The GitHub Actions workflow will automatically run
- Check the **Actions** tab to see deployment progress
- Your site will be available at: `https://yourusername.github.io/climate-dashboard`

## ⚙️ Step 3: Deploy Backend to External Service

### Option A: Render (Recommended - Free Tier)

#### 3.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

#### 3.2 Deploy Backend
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `climate-dashboard-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 3.3 Add Environment Variables
Click **Environment** tab and add:
```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=10000
```

#### 3.4 Deploy
Click **Create Web Service** and wait for deployment.

### Option B: Railway

#### 3.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

#### 3.2 Deploy Backend
1. Click **New Project** → **Deploy from GitHub repo**
2. Select your repository
3. Set **Root Directory** to `server`
4. Railway will auto-detect Node.js

#### 3.3 Add Environment Variables
Go to **Variables** tab and add:
```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
```

### Option C: Vercel

#### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your GitHub repository

#### 3.2 Configure Deployment
1. Set **Root Directory** to `server`
2. Framework preset: **Node.js**
3. Build command: `npm install`
4. Output directory: `.`
5. Install command: `npm install`

#### 3.3 Add Environment Variables
In project settings, add:
```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
```

## 🔗 Step 4: Connect Frontend to Backend

### 4.1 Update Frontend Configuration
Edit `client/src/config.ts`:

```typescript
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:3001' : 'https://your-backend-url.render.com'),
  // ... rest of config
};
```

### 4.2 Set Environment Variable (Optional)
Create `client/.env.production`:
```bash
VITE_API_BASE_URL=https://your-backend-url.render.com
```

### 4.3 Redeploy Frontend
```bash
git add .
git commit -m "Update backend URL for production"
git push origin main
```

## 🧪 Step 5: Test Your Deployment

### 5.1 Test Frontend
- Visit: `https://yourusername.github.io/climate-dashboard`
- Navigate to "What If Mode"
- Try generating a scenario

### 5.2 Test Backend
```bash
curl https://your-backend-url.render.com/api/health
```

### 5.3 Test AI Scenarios
```bash
curl -X POST https://your-backend-url.render.com/api/scenarios \
  -H "Content-Type: application/json" \
  -d '{"userInput": "What if aliens give us perfect climate technology?"}'
```

## 🔧 Troubleshooting

### Common Issues

#### Frontend Not Loading
- Check GitHub Actions for build errors
- Verify Pages source is set to "GitHub Actions"
- Check browser console for errors

#### Backend Connection Failed
- Verify backend URL in frontend config
- Check backend deployment logs
- Ensure environment variables are set
- Test backend health endpoint

#### AI Scenarios Not Working
- Check OpenAI API key in backend
- Verify API key has sufficient credits
- Check backend logs for API errors

#### Database Issues
- Backend services may reset on inactivity
- Check if database initialization ran
- Verify database file permissions

### Debug Commands

```bash
# Check backend logs (Render)
# Go to your service dashboard → Logs

# Check backend logs (Railway)
railway logs

# Check backend logs (Vercel)
vercel logs

# Test backend locally
curl http://localhost:3001/api/health

# Test production backend
curl https://your-backend-url.render.com/api/health
```

## 📊 Monitoring & Maintenance

### 1. Check Deployment Status
- **Frontend**: GitHub Actions tab
- **Backend**: Service dashboard

### 2. Monitor Usage
- **OpenAI API**: Check usage in OpenAI dashboard
- **Backend**: Monitor service metrics
- **Frontend**: GitHub Pages analytics

### 3. Update Dependencies
```bash
# Update locally
npm update
cd server && npm update
cd ../client && npm update

# Test locally
npm run dev

# Deploy updates
git add .
git commit -m "Update dependencies"
git push origin main
```

## 🎯 Next Steps

### 1. Custom Domain
- Add custom domain in GitHub Pages settings
- Update backend CORS settings

### 2. Database Migration
- Consider PostgreSQL for production
- Set up database backups

### 3. Monitoring
- Add error tracking (Sentry)
- Set up uptime monitoring
- Configure alerts

### 4. Scaling
- Add CDN for static assets
- Implement caching
- Consider serverless functions

---

**🎉 Congratulations! Your Climate Dashboard is now live on the internet!**

Share your creation:
- **Demo URL**: `https://yourusername.github.io/climate-dashboard`
- **GitHub Repo**: `https://github.com/yourusername/climate-dashboard`
- **Backend API**: `https://your-backend-url.render.com`
