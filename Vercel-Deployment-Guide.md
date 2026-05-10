# Vercel Deployment Guide

Deploy your Missouri Aetna app to Vercel and get a shareable link for coworkers.

---

## What is Vercel?

Vercel is a hosting platform that:
- ✅ Deploys your web app with one click
- ✅ Provides a shareable public link
- ✅ Supports serverless functions (backend)
- ✅ Free tier included
- ✅ No credit card required initially

---

## Prerequisites

Before you start:

1. **Code built by Claude Code** (you have this)
2. **GitHub account** (free, takes 2 minutes if needed)
3. **Claude API key** (you have this — keep it safe!)

---

## Step 1: Create a GitHub Account (if needed)

If you already have GitHub, skip to Step 2.

1. Go to https://github.com/signup
2. Enter email, password, username
3. Verify your email
4. Done!

---

## Step 2: Push Code to GitHub

In your project folder:

```bash
git init
git add .
git commit -m "Initial commit: Aetna assistant"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/aetna-customer-assistant.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

## Step 3: Deploy to Vercel

### 3.1 Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel
4. Done!

### 3.2 Import Your Project

1. In Vercel dashboard, click **"New Project"**
2. Click **"Import Git Repository"**
3. Select your `aetna-customer-assistant` repo
4. Click "Import"

### 3.3 Add Environment Variables

On the "Configure Project" screen:

1. Scroll to **"Environment Variables"**
2. Add your API key:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: (paste your actual API key)
3. Click **"Deploy"**

**Wait 2-3 minutes** while Vercel builds and deploys your app.

---

## Step 4: Get Your Public Link

Once deployment finishes, Vercel shows:

```
🎉 Deployment successful!
Your app is live at: https://aetna-assistant.vercel.app
```

**That's your shareable link!** Send it to coworkers.

---

## Step 5: Test Your App

1. Visit your Vercel link
2. Ask test questions
3. Verify answers are accurate
4. Verify sources are shown

---

## Step 6: Update Your App Later

When you need to make changes:

1. Update your local code
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Updated KB or fixed bug"
   git push
   ```
3. Vercel automatically redeploys (1-2 minutes)

---

## Troubleshooting

### Environment variable not found
- Check Vercel Settings → Environment Variables
- Make sure variable name is `ANTHROPIC_API_KEY`

### API key invalid
- Verify you pasted the entire key correctly
- Check for extra spaces

### KB files not found
- Make sure files are committed to GitHub
- Check file paths in your backend code

---

## Cost

Vercel free tier includes:
- ✅ Unlimited deployments
- ✅ Up to 100GB bandwidth/month
- ✅ Free hosting

Claude API costs separately (based on usage).

---

## Summary

| Step | Time |
|------|------|
| Create GitHub repo | 5 min |
| Push code to GitHub | 5 min |
| Sign up for Vercel | 2 min |
| Deploy project | 3 min |
| Get public link | 1 min |
| **Total** | **~16 min** |

---

## Next Steps

1. Fill in Obsidian KB
2. Build with Claude Code
3. Follow this guide to deploy
4. Share link with coworkers!
