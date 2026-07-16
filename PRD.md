# Product Requirements Document (PRD)
## TennisApp — USTA Match Tracker

**Version:** 2.0  
**Date:** 2026-04-02  
**Status:** Active  

---

## 1. Overview

### 1.1 Product Summary
TennisApp is a web application for recreational and USTA league tennis players to manage their match schedule, record match scores with point-by-point live tracking, track expenses, and stay updated with the latest tennis news. It features Auth0 authentication and is deployed as a fully serverless application on AWS.

### 1.2 Problem Statement
USTA players currently rely on scattered tools (texts, emails, paper notes) to track their match schedules and scores. There is no simple, purpose-built tool for managing a player's tennis calendar, maintaining a personal match record, tracking expenses, and following tennis news — all in one place.

### 1.3 Goals
- Allow players to view and manage their upcoming match schedule
- Enable score recording for completed USTA matches
- Provide point-by-point live score tracking for singles matches
- Provide a simple match history view per player with win/loss stats
- Track and summarize tennis-related expenses with split support
- Display latest tennis news from tennis.com
- Secure the app with Auth0 authentication (signup, login, forgot password)
- Keep the app lightweight and cost-effective with serverless AWS hosting

### 1.4 Non-Goals (Out of Scope)
- Team or league-level management
- Push notifications or email reminders
- Advanced statistics or analytics dashboards
- Mobile native app
- Integration with the official USTA platform

---

## 2. Users

### 2.1 Target User
A recreational or USTA league tennis player who wants a simple tool to:
- See who they are playing and when
- Record the score after a match or track points live
- Look back at their match history
- Track tennis-related expenses
- Stay updated with tennis news

### 2.2 Assumptions
- Users register and log in via Auth0 (email + password)
- Users are familiar with standard USTA scoring (sets, games)
- Users access the app from a desktop or laptop browser
- All authenticated users see the same shared data

---

## 3. Features

### 3.1 Dashboard (Public)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| D1 | Featured Players | Top 5 ATP and WTA players with gradient cards, rankings, and Wikipedia links | Completed |
| D2 | College Resources | D1/D2/D3/NAIA college tennis resources with links | Completed |
| D3 | D1 College Path | Timeline showing the pathway to D1 college tennis | Completed |
| D4 | Pro Journey | 7-stage timeline of the professional tennis journey | Completed |

**Layout:** Four tab sections — Featured Players, College Resources, College Path, Pro Journey.

---

### 3.2 Player Management (Authenticated)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| P1 | Add Player | Add a player with name and USTA rating | Completed |
| P2 | Edit Player | Update player name or rating | Completed |
| P3 | Delete Player | Remove a player from the system | Completed |
| P4 | Player List | View all players in a table | Completed |

**Player Fields:**
- Name (required)
- USTA Rating — e.g. 3.0, 3.5, 4.0, 4.5 (required)
- Phone number (optional)
- Notes (optional)

---

### 3.3 Match Scheduling (Authenticated)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| M1 | Create Match | Schedule a match with date, time, location, and players | Completed |
| M2 | Edit Match | Update match details before it is played | Completed |
| M3 | Cancel Match | Cancel a scheduled match | Completed |
| M4 | Upcoming Matches | View all future/scheduled matches sorted by date | Completed |
| M5 | Context-Aware Actions | Hide Edit/Cancel/Live Track for completed/cancelled matches | Completed |

**Match Fields:**
- Date & Time (required)
- Location / Court name (required)
- Match Type — Singles / Doubles (required)
- **Singles:** Player 1 vs Player 2 — opponent is optional (TBD allowed)
- **Doubles:** Team 1 (Player 1 + Player 2) vs Team 2 (Player 3 + Player 4) — all optional (TBD allowed)
- Notes (optional)

**Match Filtering:**
- "Upcoming" includes: future-dated matches OR matches with status "scheduled" (even past-dated)
- "Past" includes: matches with status "completed" or "cancelled"

---

### 3.4 Score Recording (Authenticated)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| S1 | Record Score | Enter set scores for a completed match via modal | Completed |
| S2 | Edit Score | Modify scores for already-scored matches | Completed |
| S3 | Mark Winner | Auto-determine winner based on set scores | Completed |
| S4 | Score Format | Support standard USTA format (best of 3 sets) with tiebreak | Completed |

**Score Format:**
- Up to 3 sets
- Each set: games won by each team (e.g. 6-3, 7-5, 6-4)
- Tiebreak score support (e.g. 7-6 [10-8])

---

### 3.5 Point-by-Point Live Score Tracking (Authenticated, Singles Only)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| L1 | Live Scoreboard | Real-time score display with sets, games, and point score | Completed |
| L2 | Multi-Step Wizard | Tap-based point entry: Winner → Outcome → Shot Details → Rally → Save | Completed |
| L3 | Serve Tracking | 1st/2nd serve slider toggle (green/orange) | Completed |
| L4 | Outcome Types | Ace, Winner, Unforced Error, Forced Error, Double Fault | Completed |
| L5 | Shot Details | Hand (forehand/backhand), shot subtypes, direction | Completed |
| L6 | Rally Count | Slider (0-50) with +/- buttons | Completed |
| L7 | Undo | Remove last point and recompute entire match state | Completed |
| L8 | Finish Match | Complete match from live tracking | Completed |
| L9 | Point Log | Scrollable log of all recorded points | Completed |
| L10 | Match Comments | Add comments scoped to match/set/game | Completed |
| L11 | Live Stats | Computed stats table (aces, DFs, winners, UEs, serve %) | Completed |

**Shot Subtypes:**
Regular, Return, Passing, Approach, Slice, Volley, Dropshot, Lob, Overhead, Swing Volley, Inside-In (forehand only), Inside-Out (forehand only)

**Directions:** Cross Court, Middle, Down the Line

**Ace Directions:** Body, T, Wide

**Scoring Engine:**
- Pure client-side function (`computeMatchState`) replays all points from scratch
- Handles tiebreaks at 6-6, deuce/advantage, server rotation
- Best of 3 sets, match auto-completes when a player wins 2 sets
- Undo is trivial: remove last point and recompute

---

### 3.6 Match History (Authenticated)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| H1 | Match History List | View all completed/cancelled matches with scores | Completed |
| H2 | Filter by Player | Filter match history by a specific player | Completed |
| H3 | Filter by Date Range | Filter match history by date range | Completed |
| H4 | Win/Loss Indicator | Show W/L badge relative to filtered player | Completed |
| H5 | Stats Bar | Show matches played, wins, and losses counts | Completed |
| H6 | Set Score Display | Show individual set scores in a column layout with winner highlighted | Completed |

---

### 3.7 Expense Tracking (Authenticated)

#### 3.7.1 Expense Entry

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| E1 | Log Expense | Record an expense with category, amount, date, player, and notes | Completed |
| E2 | Edit Expense | Update any field of a logged expense | Completed |
| E3 | Delete Expense | Remove an expense record | Completed |
| E4 | Link to Match | Optionally associate an expense with a specific match | Completed |
| E5 | Split Expense | Split a match-linked expense across multiple players with individual share amounts | Completed |

**Expense Fields:**
- Date (required)
- Category (required)
- Amount in USD (required)
- Paid by — which player paid (required)
- Notes / description (optional)
- Linked match (optional)
- Split — list of players and their share amounts (optional)

**Expense Categories:**
Match Fee, Court Rental, Equipment, Strings & Maintenance, Footwear, Coaching, Apparel, Other

#### 3.7.2 Expense Log

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| E6 | Expense List | Chronological list of all expenses | Completed |
| E7 | Filter by Player | View expenses for a specific player (paid or split participant) | Completed |
| E8 | Filter by Category | Filter by expense category | Completed |
| E9 | Filter by Date Range | Filter by custom date range | Completed |

#### 3.7.3 Summary & Reporting

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| E10 | Period Summary | Total spent per period — daily, weekly, monthly, yearly | Completed |
| E11 | Category Breakdown | Total spent per category within a period | Completed |
| E12 | Per-Player Summary | Total spent per player within a period (includes split amounts) | Completed |
| E13 | CSV Export | Export filtered expense list to CSV | Completed |

**Summary Views:**
- Toggle between Daily / Weekly / Monthly / Yearly
- Filterable by player (shows both paid and split-participant expenses)
- Shows total + breakdown by category
- Timezone-safe date parsing using `parseLocalDate()` helper

---

### 3.8 Tennis News (Public)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| N1 | News Feed | Display top 5 latest articles from tennis.com | Completed |
| N2 | Article Cards | Show thumbnail, title, excerpt, category, and link for each article | Completed |
| N3 | Search | Keyword search bar to filter articles | Completed |
| N4 | Daily Cache | Server scrapes tennis.com once per day and caches in memory | Completed |
| N5 | Manual Refresh | Button to force cache refresh | Completed |

**Data Source:** HTML scraping from `https://www.tennis.com/news/all-news/index` using cheerio  
**Cache:** In-memory on server, 24-hour TTL, stale cache served on scrape failure

---

### 3.9 Authentication (Auth0)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| A1 | Login | Auth0-hosted login with redirect | Completed |
| A2 | Signup | Self-registration via Auth0 signup screen | Completed |
| A3 | Forgot Password | Auth0 default password reset email flow | Completed |
| A4 | Email Activation | Auth0 default activation email on signup | Completed |
| A5 | Branded Login Page | Standalone TennisApp-branded login page with Log In and Create Account buttons | Completed |
| A6 | Profile Page | Shows user avatar, name, email, verification status, last updated | Completed |
| A7 | Nav Bar Auth Controls | User avatar with dropdown menu (Profile, Log Out) | Completed |
| A8 | Protected Routes | Players, Schedule, History, Expenses, Summary, Live Track require auth | Completed |
| A9 | Public Routes | Dashboard and News accessible without login | Completed |
| A10 | Session Duration | 1-hour session with refresh token support | Completed |
| A11 | API Token | Axios interceptor attaches Auth0 bearer token to all API requests | Completed |

**Auth Provider:** Auth0 (free tier)  
**Auth Method:** Auth0-hosted login (redirect-based)  
**Credentials:** Email + password only (no social login)  
**Domain:** `dev-y8cbnyejlrsean26.us.auth0.com`

---

## 4. User Interface

### 4.1 Pages / Views

```
TennisApp
├── Dashboard (Public)
│   ├── Featured Players (ATP/WTA top 5 with wiki links)
│   ├── College Resources
│   ├── D1 College Path timeline
│   └── Pro Journey timeline
├── Players (Authenticated)
│   ├── Player list table
│   └── Add / Edit player form
├── Schedule (Authenticated)
│   ├── Upcoming matches list
│   ├── Create / Edit match form
│   ├── Record Score modal
│   └── Live Track link (singles only, active matches)
├── Match History (Authenticated)
│   ├── Past matches with set scores
│   ├── Filter controls (player, date range)
│   └── Win/Loss/Stats bar
├── Expenses (Authenticated)
│   ├── Expense log with filters
│   └── Add / Edit expense form with splits
├── Summary (Authenticated)
│   ├── Period toggle (daily/weekly/monthly/yearly)
│   ├── Category breakdown
│   └── Per-player summary + CSV export
├── News (Public)
│   ├── Top 5 article cards with thumbnails
│   ├── Search bar
│   └── Refresh button
├── Live Score Tracking (Authenticated)
│   ├── Live scoreboard
│   ├── Multi-step point entry wizard
│   ├── Point log, comments, stats tabs
│   └── Undo / Finish Match
├── Profile (Authenticated)
│   └── User info from Auth0
├── Login Page
│   ├── Log In button
│   └── Create Account button
```

### 4.2 Navigation Bar
- **Logo:** "TennisApp" linking to Dashboard
- **Public tabs:** Dashboard, News
- **Authenticated tabs:** Players, Schedule, Match History, Expenses, Summary
- **Auth section (right side):**
  - Logged out: "Log In" button
  - Logged in: Avatar with dropdown (name, email, Profile link, Log Out)

### 4.3 Design Principles
- Clean and simple — no clutter
- Mobile-responsive layout
- Readable typography — scores and dates should be easy to scan
- Minimal clicks to complete common actions (record score, add match)
- Large tap targets for live score tracking (courtside use)

---

## 5. Tech Stack (Current — Development)

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React + Vite | Fast dev server, component-based |
| Styling | Tailwind CSS | Fast, utility-first, clean UI |
| Backend | Node.js + Express | Lightweight REST API |
| Database | SQLite + Prisma | Simple, file-based, easy schema management |
| Auth | Auth0 (free tier) | Hosted login, signup, password reset |
| News Scraping | cheerio | Server-side HTML parsing |

---

## 6. Tech Stack (Production — AWS Serverless)

| Layer | Service | Free Tier Allowance |
|-------|---------|---------------------|
| Frontend Hosting | S3 + CloudFront | 5GB storage, 1TB CDN transfer/month (12 months) |
| Backend API | API Gateway + Lambda | 1M requests/month, 1M Lambda invocations/month |
| Database | DynamoDB | 25GB storage, 25 read/write capacity units |
| DNS | Route 53 | ~$0.50/month hosted zone |
| SSL | AWS Certificate Manager | Free |
| Domain | Route 53 Registration | ~$13/year |

**Estimated Total Cost:** ~$19/year (domain + hosted zone only)

### 6.1 AWS Architecture

```
                    ┌─────────────────┐
                    │   Route 53      │
                    │ duecedashvollei │
                    │    .com         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   CloudFront    │
                    │   (CDN + SSL)   │
                    └───┬─────────┬───┘
                        │         │
              ┌─────────▼──┐  ┌───▼──────────┐
              │  S3 Bucket  │  │ API Gateway  │
              │  (React     │  │ /api/*       │
              │   static)   │  └──────┬───────┘
              └─────────────┘         │
                              ┌───────▼───────┐
                              │    Lambda     │
                              │  (Node.js)    │
                              └───────┬───────┘
                                      │
                              ┌───────▼───────┐
                              │   DynamoDB    │
                              │   Tables      │
                              └───────────────┘
```

### 6.2 AWS Migration Plan

| Step | Task | Description |
|------|------|-------------|
| 1 | AWS Account | Create AWS account |
| 2 | Domain Registration | Register `duecedashvollei.com` via Route 53 (~$13/year) |
| 3 | AWS CLI Setup | Install and configure AWS CLI with credentials |
| 4 | DynamoDB Tables | Create tables: Players, Matches, MatchPlayers, Scores, Points, MatchComments, Expenses, ExpenseSplits |
| 5 | Lambda Functions | Convert Express routes to Lambda handlers |
| 6 | API Gateway | Create REST API with routes mapped to Lambda functions |
| 7 | S3 Bucket | Create bucket for React static build files |
| 8 | CloudFront | Create distribution with S3 origin + API Gateway origin |
| 9 | ACM Certificate | Request SSL certificate for `duecedashvollei.com` |
| 10 | Route 53 DNS | Create hosted zone and point domain to CloudFront |
| 11 | Auth0 Update | Update callback URLs to `https://duecedashvollei.com` |
| 12 | Deploy | Build React, upload to S3, deploy Lambda functions |

### 6.3 DynamoDB Table Design

**Players Table**
- Partition Key: `id` (String, UUID)
- Attributes: name, ustaRating, phone, notes, createdAt

**Matches Table**
- Partition Key: `id` (String, UUID)
- GSI: `status-dateTime-index` (status → dateTime)
- Attributes: dateTime, location, matchType, status, notes, winner, createdAt

**MatchPlayers Table**
- Partition Key: `matchId` (String)
- Sort Key: `team#role` (String, e.g., "1#player1")
- Attributes: playerId, tbdName

**Scores Table**
- Partition Key: `matchId` (String)
- Sort Key: `setNumber` (Number)
- Attributes: team1Games, team2Games, tiebreak

**Points Table**
- Partition Key: `matchId` (String)
- Sort Key: `id` (String, UUID)
- Attributes: setNumber, gameNumber, pointNumber, serverId, winner, outcome, shotType, direction, serveType, serveIn, rallyCount, comment

**MatchComments Table**
- Partition Key: `matchId` (String)
- Sort Key: `id` (String, UUID)
- Attributes: scope, setNumber, gameNumber, comment, createdAt

**Expenses Table**
- Partition Key: `id` (String, UUID)
- GSI: `paidById-date-index` (paidById → date)
- Attributes: date, category, amount, paidById, matchId, notes, createdAt

**ExpenseSplits Table**
- Partition Key: `expenseId` (String)
- Sort Key: `playerId` (String)
- Attributes: shareAmount

**NewsCache Table**
- Partition Key: `cacheKey` (String, fixed "latest")
- Attributes: articles (List), fetchedAt (Number, epoch ms)
- TTL: `expiresAt` (24 hours from fetch)

---

## 7. Data Model (Current — SQLite/Prisma)

### Player
```
id          INT (PK, auto-increment)
name        TEXT
ustaRating  TEXT     -- e.g. "3.5"
phone       TEXT
notes       TEXT
createdAt   DATETIME
```

### Match
```
id           INT (PK, auto-increment)
dateTime     DATETIME
location     TEXT
matchType    TEXT     -- "singles" | "doubles"
status       TEXT     -- "scheduled" | "completed" | "cancelled"
winner       TEXT     -- "team1" | "team2" | null
notes        TEXT
createdAt    DATETIME
```

### MatchPlayer
```
id        INT (PK, auto-increment)
matchId   INT (FK -> Match)
playerId  INT (FK -> Player, nullable)
team      INT    -- 1 or 2
role      TEXT   -- "player1" | "player2"
tbdName   TEXT   -- name for non-registered players
```

### Score
```
id          INT (PK, auto-increment)
matchId     INT (FK -> Match)
setNumber   INT    -- 1, 2, 3
team1Games  INT
team2Games  INT
tiebreak    TEXT   -- optional, e.g. "10-8"
```

### Point
```
id          INT (PK, auto-increment)
matchId     INT (FK -> Match)
setNumber   INT
gameNumber  INT
pointNumber INT
serverId    INT    -- 1 or 2 (which team is serving)
winner      INT    -- 1 or 2
outcome     TEXT   -- "ace" | "winner" | "unforced_error" | "forced_error" | "double_fault"
shotType    TEXT   -- "forehand" | "backhand"
direction   TEXT   -- "cross_court" | "middle" | "down_the_line"
serveType   TEXT   -- "first" | "second"
serveIn     BOOL
rallyCount  INT
comment     TEXT
```

### MatchComment
```
id          INT (PK, auto-increment)
matchId     INT (FK -> Match)
scope       TEXT   -- "match" | "set" | "game"
setNumber   INT
gameNumber  INT
comment     TEXT
createdAt   DATETIME
```

### Expense
```
id          INT (PK, auto-increment)
date        DATETIME
category    TEXT
amount      REAL (USD)
paidById    INT (FK -> Player)
matchId     INT (FK -> Match, optional)
notes       TEXT
createdAt   DATETIME
```

### ExpenseSplit
```
id          INT (PK, auto-increment)
expenseId   INT (FK -> Expense)
playerId    INT (FK -> Player)
shareAmount REAL (USD)
```

---

## 8. API Endpoints

### Players
```
GET    /api/players            List all players
POST   /api/players            Add a player
PUT    /api/players/:id        Update a player
DELETE /api/players/:id        Delete a player
```

### Matches
```
GET    /api/matches            List matches (query: status=upcoming|past|all)
GET    /api/matches/:id        Get single match with players and scores
POST   /api/matches            Create a match with players
PUT    /api/matches/:id        Update a match and players
DELETE /api/matches/:id        Delete a match
PATCH  /api/matches/:id/cancel Cancel a match
```

### Scores
```
POST   /api/matches/:id/score  Record/update scores for a match (sets winner + status)
GET    /api/matches/:id/score  Get scores for a match
```

### Points (Live Tracking)
```
GET    /api/matches/:id/points      Get all points for a match
POST   /api/matches/:id/points      Record a new point
DELETE /api/matches/:id/points/:pid Delete a specific point (undo)
DELETE /api/matches/:id/points      Delete all points for a match (reset)
```

### Match Comments
```
GET    /api/matches/:id/comments    Get all comments for a match
POST   /api/matches/:id/comments    Add a comment
```

### Match Stats
```
GET    /api/matches/:id/stats       Computed stats (aces, DFs, winners, UEs, serve %)
```

### Expenses
```
GET    /api/expenses                List expenses (filters: playerId, category, from, to)
POST   /api/expenses                Create expense (with optional splits)
PUT    /api/expenses/:id            Update expense
DELETE /api/expenses/:id            Delete expense
GET    /api/expenses/summary        Summary totals (params: period, playerId)
GET    /api/expenses/export         Export as CSV
```

### News
```
GET    /api/news                    Get cached articles (query: q=search)
POST   /api/news/refresh            Force cache refresh
```

### Health
```
GET    /api/health                  Health check
```

---

## 9. Success Criteria

- A user can sign up, receive an activation email, and log in
- A user can add players and schedule a match in under 2 minutes
- A user can record a score for a completed match in under 1 minute
- A user can track a live match point-by-point with 3 taps per point
- Upcoming matches are clearly visible on the schedule page
- Match history shows scores and win/loss results at a glance
- Expenses can be logged, split, and summarized by period
- Latest tennis news is visible without login
- The app runs on AWS serverless with near-zero cost

---

## 10. Known Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Timezone-safe date parsing | `new Date("YYYY-MM-DD")` parses as UTC midnight causing off-by-one. Fixed with `parseLocalDate()` that splits string and uses `new Date(y, m-1, d)` |
| Client-side scoring engine | Pure function `computeMatchState()` replays all points to compute state. Makes undo trivial (remove last point, recompute) |
| OR-based expense filtering | Player filter uses `OR` query matching both `paidById` and `splits.some.playerId` |
| Upcoming match filter | Uses `OR` for future-dated matches + status "scheduled" to include past-dated but still-scheduled matches |
| News scraping URL | `tennis.com/news/articles/` is JS-rendered (empty `<main>`). Uses `/news/all-news/index` which has server-rendered HTML |
| News image handling | Standard cards use `data-src` (lazy-loaded). Scraper checks `data-src` first, falls back to `src`, skips base64 placeholders |

---

## 11. Open Questions

1. ~~Should doubles matches track 2 players per side, or keep it simple with just a team name?~~ **Decided: Track all 4 individual players (2 per team)**
2. ~~Should we allow adding a match without a second player registered (i.e. TBD opponent)?~~ **Decided: Yes — opponent fields are optional; TBD allowed**
3. ~~Do we need a simple date-based calendar view, or is a sorted list sufficient?~~ **Decided: Simple sorted list**
4. ~~Should we use Okta or Auth0 for authentication?~~ **Decided: Auth0 (free tier, hosted login)**
5. ~~Should user data be scoped per user or shared?~~ **Decided: Shared data for all authenticated users**
6. Should we add multi-tenancy / per-user data scoping in a future version?
7. Should live score tracking support doubles matches?

---

## 12. Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-03-30 | Initial draft — player management, match scheduling, score recording, match history |
| 1.1 | 2026-03-30 | Doubles: track 4 individual players (2 per team); updated data model |
| 1.2 | 2026-03-30 | Opponents are optional (TBD allowed); schedule view is a simple sorted list |
| 1.3 | 2026-03-31 | Added Expense Tracking feature — multi-player, match-linked, splits, summaries, CSV export |
| 1.4 | 2026-04-01 | Enhanced Dashboard — Featured Players (ATP/WTA), College Resources, D1 Path, Pro Journey |
| 1.5 | 2026-04-01 | Timezone bug fixes — expense date parsing, summary period filtering |
| 1.6 | 2026-04-01 | Expense summary split amount fix — OR-based player filtering |
| 1.7 | 2026-04-02 | Point-by-point live score tracking — multi-step wizard, scoring engine, stats, comments |
| 1.8 | 2026-04-02 | Schedule fix — upcoming filter includes past-dated "scheduled" matches; context-aware action buttons |
| 1.9 | 2026-04-02 | Tennis News feature — scraping tennis.com, daily cache, search, top 5 articles |
| 2.0 | 2026-04-02 | Auth0 authentication — signup, login, forgot password, protected routes, profile page, nav bar auth controls. AWS serverless architecture plan (S3 + CloudFront + API Gateway + Lambda + DynamoDB) for hosting on `duecedashvollei.com` |
