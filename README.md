# 🌍 Climate Dashboard

A full-stack AI-powered climate scenario modeling application that explores speculative futures through interactive charts, narratives, and data visualization.

## ✨ Features

- **🌡️ Real-time Climate Data**: Current indicators with forecasts to 2100
- **🤖 AI-Powered Scenarios**: Generate unique "What If" climate futures
- **📊 Interactive Charts**: Compare baseline vs. speculative forecasts
- **🗺️ Climate Reality Constraints**: Scientifically accurate scenario modeling
- **📱 Responsive Design**: Modern UI built with React + Tailwind CSS

## 🚀 Live Demo

**Frontend**: [Your GitHub Pages URL will appear here]
**Backend**: [Your external backend URL will appear here]

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Charts**: Recharts with overlay comparisons
- **Backend**: Node.js + Express + SQLite
- **AI**: OpenAI GPT-3.5-turbo for scenario generation
- **Deployment**: GitHub Pages (frontend) + External backend

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI scenarios)

## 🏃‍♂️ Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/climate-dashboard.git
cd climate-dashboard
npm run install-all
```

### 2. Environment Setup
```bash
cd server
cp .env.example .env
# Edit .env with your OpenAI API key
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Initialize Database
```bash
cd server
npm run init-db
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm run dev
```

### 5. Open Browser
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🌐 Deployment to GitHub

### Frontend (GitHub Pages)

1. **Push to GitHub**: The GitHub Actions workflow automatically deploys to Pages
2. **Enable Pages**: Go to Settings → Pages → Source: GitHub Actions
3. **Your URL**: `https://yourusername.github.io/climate-dashboard`

### Backend (External Service)

Choose one of these services for your backend:

#### Option A: Render (Recommended - Free Tier)
```bash
# 1. Create account at render.com
# 2. Connect your GitHub repo
# 3. Create new Web Service
# 4. Set build command: npm install && npm run build
# 5. Set start command: npm start
# 6. Add environment variables:
#    - OPENAI_API_KEY=your_key
#    - NODE_ENV=production
```

#### Option B: Railway
```bash
# 1. Create account at railway.app
# 2. Deploy from GitHub
# 3. Add environment variables
# 4. Get your deployment URL
```

#### Option C: Vercel
```bash
# 1. Create account at vercel.com
# 2. Import your GitHub repo
# 3. Set root directory to /server
# 4. Add environment variables
```

### Update Frontend Configuration

After deploying your backend, update the frontend to use the production backend:

```typescript
// client/src/config.ts
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.railway.app'  // Your deployed backend URL
  : 'http://localhost:3001';                // Local development
```

## 🔧 Configuration

### Environment Variables

```bash
# server/.env
OPENAI_API_KEY=sk-your-openai-key
NODE_ENV=development
PORT=3001
```

### Database

- **Development**: SQLite (auto-created)
- **Production**: PostgreSQL (recommended for scaling)

## 📊 API Endpoints

- `GET /api/health` - Health check
- `GET /api/climate/baseline` - Climate data
- `GET /api/impacts/baseline` - Human impact data
- `GET /api/scenarios` - List scenarios
- `POST /api/scenarios` - Create new scenario
- `GET /api/scenarios/:id` - Get specific scenario

## 🎯 Usage Examples

### Generate AI Climate Scenario
```bash
curl -X POST http://localhost:3001/api/scenarios \
  -H "Content-Type: application/json" \
  -d '{"userInput": "What if we discover unlimited fusion energy in 2025?"}'
```

### Test Health Endpoint
```bash
curl http://localhost:3001/api/health
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill existing processes
   pkill -f "node|vite|nodemon"
   ```

2. **OpenAI API Errors**
   - Check your API key in `.env`
   - Ensure sufficient credits
   - Verify API key format

3. **Database Issues**
   ```bash
   cd server
   rm climate_dashboard.db
   npm run init-db
   ```

4. **Frontend Build Errors**
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- OpenAI for AI scenario generation
- Recharts for data visualization
- Tailwind CSS for styling
- The climate science community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/climate-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/climate-dashboard/discussions)

---

**Built with ❤️ for climate awareness and education**
