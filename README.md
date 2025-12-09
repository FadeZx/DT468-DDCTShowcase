# DT468 DDCT Showcase Website 💗

**Deployment URL:** https://dt-468-ddct-showcase.vercel.app/

**Video Presentation & Other:** https://drive.google.com/drive/folders/1BtIqaEzlHUJiing4vjUHkQDuuK3Dhd5Y?usp=drive_link

```bash
A portfolio showcase for the DDCT / DT468 course, built with React and Supabase.
This application allows students to upload their projects (including media, files, and descriptions)
and enables teachers/admins to browse, filter, and manage the submissions.
```

## Tech Stack 💻

### Core Technologies
- **Framework:** React (with TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design tokens and utility classes.
- **Backend as a Service (BaaS):** Supabase
  - **Database:** Postgres
  - **Authentication:** Supabase Auth for user and role management.
  - **File Storage:** Supabase Storage for project media and downloads.
  - **Real-time:** Supabase Real-time Subscriptions for live updates on likes and comments.

### Advanced & Third-Party Components
- **UI Components:** A custom library inspired by `shadcn/ui` (Buttons, Cards, Tabs, Dialogs).
- **Image Gallery:** `slick-carousel` for the "Steam-like" project media gallery.
- **Data Visualization:** A charting library for the admin analytics dashboard.
- **Animation:** CSS transitions and keyframe animations via `tailwindcss-animate` for interactive UI elements and component states.
- **File Handling:** `jszip` for bundling project files for download.
- **Graph Rendering:** `recharts` for admin dashboard charts (bar, pie, and line visualizations).

## Getting Started ✨

Follow these steps to get the project running on your local machine for development and testing purposes.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later recommended)
- A [Supabase](https://supabase.com/) account and project.
- A terminal or command prompt.
- (Optional) [GitHub Desktop](https://desktop.github.com/) if you prefer a GUI for Git.

### 2. Clone the Repository

You can clone the repository using either the command line or GitHub Desktop.

### 3. Install Dependencies

Once the repository is cloned, open a terminal in the project's root directory. (In GitHub Desktop, you can go to `Repository > Open in Command Prompt`). Then, run the following command:

```bash
npm install
```

### 4. Configure environment

Create a `.env` or `.env.local` file follows `.env.example` poject root with your Supabase keys, for example:

### 5. Run the dev server

```bash
npm run dev
```

## Main Features

- **Authentication** - secure login/logout for students, partners and administrators using Supabase Auth.
- **Home Page** - category and tag-based browsing of student projects.
- **Project Page** - Steam-like gallery, HTML description, files/downloads, likes and comments.
- **Upload Flow** - students can upload projects with media, tags and files.
- **Events** - events home page lists Supabase-backed events; event detail page shows full info; admins can create/edit/delete events in Event Management.
- **Profiles & Resume** - students can set up their profile info and export their own resume PDF; partners/admins can view full profiles and export resume summaries for others.
- **Admin Dashboard** - admin-only analytics (Recharts), project management, events management, and account settings with quick logins.


## ⚠️ Important Note About Database Performance

The account has exceeded its monthly egress (outbound data) limit, which affects how quickly media and project files load.

As a result:
- Images, videos, and project assets may load slowly
- Some files may fail to load during peak hours
- Real-time and storage operations might be temporarily throttled
```bash
  This issue is not related to the application code,
  but rather to the hosting limits of the current Supabase plan.
  The system performs normally when deployed on a Supabase instance with sufficient egress bandwidth.
```
