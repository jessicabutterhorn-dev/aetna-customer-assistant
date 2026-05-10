# PRD: Missouri Aetna Customer Service Assistant Web App

**Project**: Customer Service Assistant - Missouri Aetna Plans  
**Owner**: Jessica Butterhorn  
**Date**: May 2026  
**Goal**: Answer questions about Missouri Aetna plans with 100% accuracy, showing sources from the knowledge base

---

## 1. Overview

Create a web app that allows users to ask questions about Missouri Aetna health plans and receive accurate answers with citations to source documents.

**Key Requirements:**
- ✅ Answer questions with 100% accuracy
- ✅ Show sources (which KB notes were used)
- ✅ Share via a link (coworkers/others can access)
- ✅ User-friendly interface
- ✅ No authentication required (public link)

---

## 2. User Flow

```
User visits link
    ↓
Enters question (e.g., "What's the deductible for Silver Plan?")
    ↓
App searches Obsidian KB for relevant Missouri Aetna data
    ↓
Claude AI processes: KB context + user question
    ↓
App returns: Answer + source citations
    ↓
User sees formatted response with sources
```

---

## 3. Features

### MVP (Minimum Viable Product)
- [ ] Text input box for questions
- [ ] Real-time search of Missouri Aetna KB (all 6 notes)
- [ ] Claude API processes question + KB context
- [ ] Display answer in readable format
- [ ] Show which KB notes were used as sources
- [ ] Clean, simple UI (mobile-friendly)
- [ ] No authentication (public link)

---

## 4. Technical Architecture

### Frontend
- **Framework**: React
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (free tier)

### Backend
- **Framework**: Node.js + Express (Vercel serverless functions)
- **API**: Anthropic Claude API (claude-opus-4-6)
- **KB Source**: Markdown files from Missouri-Aetna-Plans folder

### Data Flow
```
Browser (React)
    ↓ POST /api/ask-question
Vercel Function (Node.js)
    ↓
Read KB files from Missouri-Aetna-Plans
    ↓
Call Claude API with KB context
    ↓
Return answer + sources
    ↓ Response
Browser displays result
```

---

## 5. API Specification

### POST /api/ask-question

**Request:**
```json
{
  "question": "What's the deductible for the Silver Plan?"
}
```

**Response:**
```json
{
  "question": "What's the deductible for the Silver Plan?",
  "answer": "The Silver Plan deductible is $4,000 for individuals and $8,000 for families.",
  "sources": [
    {
      "file": "Coverage-Details.md",
      "excerpt": "Silver Plan\n- Deductible: $4,000 individual / $8,000 family"
    }
  ]
}
```

---

## 6. Deployment

1. **Prepare KB** - Fill Missouri-Aetna-Plans folder with 6 markdown files
2. **Build App** - Use Claude Code to generate the app
3. **Deploy to Vercel** - Push to GitHub, import to Vercel
4. **Share Link** - Get public URL to share with coworkers

---

## 7. Success Criteria

- [ ] App launches without errors
- [ ] Can answer 10 test questions about Missouri Aetna plans
- [ ] Sources are cited correctly
- [ ] Answers are 100% accurate (verified against KB)
- [ ] Link is shareable and works for coworkers
- [ ] Page loads in <2 seconds
- [ ] Mobile-friendly UI

---

## 8. Next Steps

1. Fill in Obsidian KB (Obsidian-KB-Structure-Missouri-Aetna.md)
2. Use Claude Code to build the app (Claude-Code-Build-Instructions.md)
3. Deploy to Vercel (Vercel-Deployment-Guide.md)
4. Test and share with coworkers
