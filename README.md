# TaskFlow - Kanban Board Application

A modern, production-ready Trello-like Kanban board application built with React, TypeScript, and Supabase.

![TaskFlow](public/card.jpg)

## ✨ Features

### Authentication
- 🔐 Email/password sign up & login
- 🔒 Protected routes with automatic redirects
- 💾 Persistent sessions

### Boards
- 📋 Create, rename, and delete boards
- 🎨 Beautiful card-based dashboard view
- 👤 User-specific boards (data isolation)

### Lists
- 📝 Create lists within boards
- ✏️ Inline rename functionality
- 🗑️ Delete lists with all cards

### Cards
- 🎴 Create cards in any list
- 📄 Add titles and descriptions
- ✨ Click to open detail modal
- 🗑️ Delete with confirmation

### Drag & Drop
- 🖱️ Move cards within the same list
- ↔️ Move cards across different lists
- ⚡ Optimistic UI updates for smooth UX
- 🎯 Visual feedback while dragging

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS 4.x |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Routing | React Router v7 |
| Backend | Supabase (Auth + PostgreSQL) |
| Build Tool | Vite |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone & Install

```bash
cd "Trello clone"
npm install
```

### 2. Configure Environment

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# The schema file is located at:
supabase/schema.sql
```

This creates:
- `boards`, `lists`, `cards` tables
- Row Level Security (RLS) policies
- Indexes for performance

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # Protected route wrapper
│   ├── board/         # Board, List, Card components
│   ├── layout/        # Header component
│   └── ui/            # Reusable UI components
├── contexts/          # Auth context
├── lib/               # Supabase client
├── pages/             # Route pages
├── types/             # TypeScript types
├── App.tsx            # Router setup
└── index.css          # Global styles
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🔒 Security

This app uses Supabase Row Level Security (RLS) to ensure:
- Users can only access their own boards
- Lists and cards inherit access from board ownership
- All security is enforced at the database level

## 📄 License

MIT License

---

Built with ❤️ using React, TypeScript & Supabase
