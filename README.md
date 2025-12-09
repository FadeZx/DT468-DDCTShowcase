# DT468 DDCT Showcase

**Authors:** [Your Name(s)]
**Deployment URL:** [Link to your live site, if applicable]

A portfolio showcase for the DDCT / DT468 course, built with React and Supabase. This application allows students to upload their projects (including media, files, and descriptions) and enables teachers/admins to browse, filter, and manage the submissions.

## Tech Stack

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
- **File Handling:** `jszip` for bundling project files for download.

## Getting Started

Follow these steps to get the project running on your local machine for development and testing purposes.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later recommended)
- A [Supabase](https://supabase.com/) account and project.
- A terminal or command prompt.
- (Optional) [GitHub Desktop](https://desktop.github.com/) if you prefer a GUI for Git.

### 2. Clone the Repository

You can clone the repository using either the command line or GitHub Desktop.

**Using the Command Line:**
```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```

**Using GitHub Desktop:**
1. Go to the repository URL in your browser.
2. Click the green **`< > Code`** button.
3. Select **Open with GitHub Desktop**.
4. Choose a local path and click **Clone**.

### 3. Install Dependencies

Once the repository is cloned, open a terminal in the project's root directory. (In GitHub Desktop, you can go to `Repository > Open in Command Prompt`). Then, run the following command:

```bash
npm install
```

### 2. Configure environment

Create a `.env` or `.env.local` file in the project root with your Supabase keys, for example:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

(Use the same variable names you already use in your existing Supabase client.)

### 3. Run the dev server

```bash
npm run dev
```

The app should be available at `http://localhost:5173` or the port Vite shows in the console.

## Main Features

- **Authentication** – secure login/logout for students, partners and administrators using Supabase Auth.
- **Home Page** – category and tag-based browsing of student projects.
- **Project Page** – Steam-like gallery, HTML description, files/downloads, likes and comments.
- **Upload Flow** – students can upload projects with media, tags and files.
- **Admin Dashboard** – admin-only views for analytics, project management and account settings.

## Scripts

Common npm scripts (check `package.json` for the full list):

- `npm run dev` – start the Vite dev server.
- `npm run build` – build the production bundle.
- `npm run preview` – preview the production build locally.

## Folder Structure (high level)

- `showcase/src/components` – React components (HomePage, ProjectPage, Admin tabs, etc.).
- `showcase/src/utils` – utility functions (e.g. file storage helpers, likes helpers).
- `showcase/src/hooks` – React hooks (e.g. `useProjectLikes`).
- `showcase/src/index.css` – Tailwind and custom design tokens.

## Notes

- Supabase tables such as `projects`, `project_files`, `project_likes`, `project_comments` and related views must exist and match the queries in the code.
- This README is a general overview for development and assignment submission; update any details (course name, authors, deployment URL) to match your final project.
