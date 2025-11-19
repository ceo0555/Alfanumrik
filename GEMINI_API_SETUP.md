# 🔑 Gemini API Setup Guide

## Quick Setup (3 Steps)

### Step 1: Get Your Gemini API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the generated API key (starts with `AIza...`)

---

### Step 2: Create `.env` File

In your project root (`/workspace`), create a file named `.env`:

```bash
# In terminal:
cd /workspace
nano .env
```

Or simply create a new file called `.env` in the root directory.

---

### Step 3: Add API Key to `.env`

Paste this into your `.env` file:

```env
VITE_GEMINI_API_KEY=AIzaSy...your_actual_api_key_here...
```

**Replace** `AIzaSy...your_actual_api_key_here...` with your actual Gemini API key.

---

## ⚠️ Important Notes

### Security
- **NEVER commit `.env` file to git** - it contains secrets
- The `.gitignore` file should already exclude `.env`
- Share `.env.example` (without real keys) with your team instead

### File Location
```
/workspace/
├── .env          ← Create this file (add your API key here)
├── .env.example  ← Template file (no real keys)
├── package.json
├── vite.config.ts
└── ...
```

### Supported Variable Names

The app checks for API keys in this order:
1. `VITE_GEMINI_API_KEY` ⭐ **Recommended**
2. `VITE_API_KEY`
3. `API_KEY`
4. `GEMINI_API_KEY`

**Use `VITE_GEMINI_API_KEY` for best compatibility.**

---

## 🚀 After Setup

### Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Verify API Key is Working

1. Navigate to any lesson in the app
2. Try generating content or using AI features
3. If you see an error like "Gemini API key is not configured", check:
   - File is named exactly `.env` (not `.env.txt` or `.env.local`)
   - Variable name is correct: `VITE_GEMINI_API_KEY`
   - No extra spaces around the `=` sign
   - Development server was restarted after creating `.env`

---

## 🛠️ Troubleshooting

### Error: "Gemini API key is not configured"

**Solution:**
1. Check `.env` file exists in `/workspace` directory
2. Verify the variable name is `VITE_GEMINI_API_KEY`
3. Ensure no typos in the API key
4. Restart the dev server: `Ctrl+C` then `npm run dev`

### Error: "API key is invalid"

**Solution:**
1. Go back to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Generate a new API key
3. Update `.env` with the new key
4. Restart the server

### API Key Not Loading

**Check these:**
```bash
# 1. Verify file exists
ls -la /workspace/.env

# 2. Check file contents (will show your key - be careful!)
cat /workspace/.env

# 3. Ensure proper format
# ✅ Correct: VITE_GEMINI_API_KEY=AIzaSyABC123...
# ❌ Wrong: VITE_GEMINI_API_KEY = "AIzaSyABC123..."
# ❌ Wrong: export VITE_GEMINI_API_KEY=AIzaSyABC123...
```

### Still Not Working?

**Hard Reset:**
```bash
# 1. Stop server
# Ctrl+C

# 2. Clear cache
rm -rf node_modules/.vite
rm -rf dist

# 3. Restart
npm run dev
```

---

## 📋 Example `.env` File

```env
# ✅ CORRECT FORMAT
VITE_GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr

# ❌ WRONG - No quotes needed
# VITE_GEMINI_API_KEY="AIzaSyABC123..."

# ❌ WRONG - No spaces around =
# VITE_GEMINI_API_KEY = AIzaSyABC123...

# ❌ WRONG - Don't use export
# export VITE_GEMINI_API_KEY=AIzaSyABC123...
```

---

## 🔍 How It Works

### In Development (npm run dev)
Vite reads `.env` file and exposes variables starting with `VITE_` to your React app via `import.meta.env`.

### In Production Build (npm run build)
The API key is compiled into the build at build-time. For production, you should:
- Use environment variables from your hosting platform
- Or set `VITE_GEMINI_API_KEY` during build process

---

## 🎯 Where API Key is Used

The Gemini API key is used for all AI-powered features:
- **Lesson Generation** - Creating detailed lesson content
- **AI Assistant** - Student and parent AI tutors
- **Question Generation** - Creating practice questions
- **Grading** - AI-powered assignment grading
- **Remediation** - Personalized learning plans
- **Analytics** - Generating reports and insights
- **Video Generation** - Creating educational videos
- **Curriculum Planning** - Automated syllabus planning
- And many more AI features!

---

## ✅ Verification Checklist

Before starting development, ensure:

- [ ] I have a Gemini API key from Google AI Studio
- [ ] `.env` file exists in `/workspace` directory
- [ ] Variable is named `VITE_GEMINI_API_KEY`
- [ ] API key is pasted correctly (no extra spaces)
- [ ] `.env` file is NOT committed to git
- [ ] Development server was restarted after creating `.env`
- [ ] AI features are working in the app

---

## 🎉 You're All Set!

Once configured, all AI-powered features in the platform will work seamlessly. The platform will automatically use your API key for all Gemini API calls.

**Need Help?**
- Check the [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- Review `services/geminiService.ts` to see how the API is used
- Check `utils/env.ts` to understand how the key is loaded

---

**Generated for Alfanumrik LMS Platform**  
*Last Updated: 2025-11-19*
