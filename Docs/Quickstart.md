# ⚡ Quick Start Guide — GitHub Pages Personal Website

This guide walks a beginner through every step, from creating a GitHub account to seeing their live website online. No prior experience required.

---

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] A **GitHub account** — create one free at [github.com](https://github.com)
- [ ] **Git** installed — download at [git-scm.com](https://git-scm.com)
- [ ] A **code editor** — [VS Code](https://code.visualstudio.com/) is recommended
- [ ] (Optional) Python 3 for local preview

Verify Git is installed:
```bash
git --version
# Expected output: git version 2.x.x
```

---

## Phase 1 — GitHub Repository Setup

### Step 1.1 — Create the repository

1. Go to [github.com/new](https://github.com/new)
2. Set the **Repository name** to exactly: `yourusername.github.io`
   - Replace `yourusername` with your actual GitHub username (exact match, case-sensitive)
   - Example: if your username is `janedoe`, name it `janedoe.github.io`
3. Set **Visibility** to **Public**
   > ⚠️ GitHub Pages for User Sites requires a **public** repository on the free plan. A private repo will not serve the site without GitHub Pro.
4. Check **"Add a README file"**
5. Click **"Create repository"**

### Why does the name matter?

GitHub has two types of Pages sites:

| Type | Repo name | URL served |
|---|---|---|
| **User Site** | `username.github.io` | `https://username.github.io` |
| **Project Site** | `any-other-name` | `https://username.github.io/any-other-name` |

A User Site puts your content at the root URL — perfect for a personal homepage.

---

## Phase 2 — Clone and Set Up Locally

### Step 2.1 — Clone the repository

Open your terminal and run:

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

### Step 2.2 — Copy the website files

Copy all files from this project into the cloned folder:

```
yourusername.github.io/
├── index.html      ← copy from this project
├── styles.css      ← copy from this project
├── main.js         ← copy from this project
├── .gitignore      ← copy from this project
└── README.md       ← already there from GitHub
```

---

## Phase 3 — Personalise the Website

Open each file in VS Code and make these changes:

### `index.html` — your content

Find and replace every placeholder:

| Placeholder | Replace with |
|---|---|
| `[Your Name]` | Your full name |
| `[City, Country]` | Your location |
| `Software Engineer & Creative Problem-Solver` | Your own tagline |
| `you@example.com` | Your email address |
| `username` in GitHub/LinkedIn/Twitter links | Your actual usernames |
| Project titles, descriptions, and links | Your real projects |

### `styles.css` — your brand colour

At the top of `styles.css`, find `:root` and change `--clr-accent`:

```css
:root {
  --clr-accent: #58a6ff;  /* ← change to your preferred colour */
}
```

Popular choices: `#f97316` (orange) · `#10b981` (green) · `#8b5cf6` (purple)

### `main.js` — contact form

For the form to actually send emails, sign up at [formspree.io](https://formspree.io), create a form, and replace the `mailto:` line (see comments in `main.js`).

---

## Phase 4 — Preview Locally

Always preview before pushing:

```bash
# macOS / Linux
python3 -m http.server 8080

# Windows (Command Prompt)
python -m http.server 8080
```

Open your browser at **`http://localhost:8080`** — you should see your full website.

Press `Ctrl+C` to stop the server.

Or use the helper script:
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

---

## Phase 5 — Deploy to GitHub Pages

> **TL;DR — use the script.** `scripts/init-repo.sh` automates every step below
> (git init → create repo → push → enable Pages → wait for build).

### Option A — One-command automated setup (recommended)

#### Prerequisites

| Tool | Install |
|---|---|
| `git` | [git-scm.com](https://git-scm.com) |
| `gh` (GitHub CLI) | [cli.github.com](https://cli.github.com) |
| Authenticated `gh` session | Run `gh auth login` once |

#### Run the script

```bash
# Make executable (first time only)
chmod +x scripts/init-repo.sh

# Run from the project root
./scripts/init-repo.sh
```

The script will:
1. ✅ Verify `git`, `gh`, and authentication
2. ✅ Run `git init` and set branch to `main` (skips if already done)
3. ✅ Configure `git user.name` / `git user.email` from your GitHub profile
4. ✅ Exclude `.bob/` from the commit
5. ✅ Stage and commit all files
6. ✅ Create the public repo `<username>.github.io` on GitHub
7. ✅ Push to `origin/main`
8. ✅ Enable GitHub Pages (branch: main, path: /)
9. ✅ Wait for the build and confirm with an HTTP 200 check
10. ✅ Print the live URL

**Environment variable overrides** (all optional):

```bash
GITHUB_USER=myuser  REPO_NAME=myuser.github.io  ./scripts/init-repo.sh
```

---

### Option B — Manual step-by-step

#### Step 5.1 — Install and authenticate GitHub CLI

```bash
# macOS (Homebrew)
brew install gh

# Authenticate
gh auth login
# → choose: GitHub.com → HTTPS → Login with a web browser
```

#### Step 5.2 — Initialise git and push

```bash
# Initialise git in the project root
git init
git branch -m main

# Stage and commit all files
git add .
git commit -m "🚀 Initial personal website"

# Create the public GitHub repo and push in one command
gh repo create yourusername.github.io \
  --public \
  --description "Personal website on GitHub Pages" \
  --source=. \
  --remote=origin \
  --push
```

#### Step 5.3 — Enable GitHub Pages

GitHub Pages is auto-enabled for `<username>.github.io` repos. If not:

1. Go to your repository → **Settings** → **Pages**
2. Source: branch **main**, folder **/ (root)** → **Save**

#### Step 5.4 — Wait and verify

GitHub Pages takes **30–120 seconds** to build and deploy. Then:

1. Open `https://yourusername.github.io` in your browser
2. You should see your live website
3. If you see a 404, wait another minute and hard-refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`)

---

## Phase 6 — Creating a GitHub Personal Access Token

### What is a Personal Access Token (PAT)?

A **Personal Access Token (PAT)** functions as a secure credential string that substitutes for your GitHub password during HTTPS Git operations (`git clone`, `git push`), GitHub CLI authentication, or automated scripts interacting with GitHub APIs. Personal access tokens provide granular scope controls and can be revoked individually at any time.

### Step-by-Step Instructions to Generate a PAT

1. Sign in to your account at [github.com](https://github.com).
2. Go directly to **[https://github.com/settings/tokens](https://github.com/settings/tokens)**
   *(Or navigate from GitHub: click your profile photo in the top right → **Settings** → scroll down to **Developer settings** in the left sidebar → **Personal access tokens** → **Tokens (classic)**).*
3. Click **Generate new token** → select **Generate new token (classic)** (or Fine-grained token if specified by your organization).
4. Give your token an identifiable **Note** indicating its purpose (e.g., `github-pages-token` or `laptop-git-auth`).
5. Set an **Expiration** date (recommended: `30 days` or `90 days`).

### Selecting Appropriate Scopes and Permissions

Check the boxes corresponding to the actions you need to perform:

- **For repository management & git push operations:**
  - `repo` — Grants full control of private and public repositories.
  - `workflow` — Required if your commits modify `.github/workflows` files.
- **For GitHub Pages interaction:**
  - `repo` (includes `repo:status` and `public_repo`).
- **For reading user account details:**
  - `read:user`, `user:email`.

> 💡 **Tip:** Always follow the principle of least privilege: select only the scopes your current tasks require.

### Securely Storing Your Generated Token

- Copy the token immediately using the copy button next to the token string.
- Save the token in a secure password manager (e.g. 1Password, Bitwarden, KeePass) or secure environment variable store.
- Configure Git credential helpers so you do not need to retype or hardcode it:
  ```bash
  # macOS
  git config --global credential.helper osxkeychain

  # Linux / Generic
  git config --global credential.helper store
  ```
- **Never commit tokens into source code, configuration files, or public git repositories.**

> ⚠️ **Warning:** GitHub will display your new Personal Access Token **only once**. Once you leave or refresh the page, you will not be able to view it again. Make sure to copy and store it immediately in a safe location.

### Step 6.1 — Add Your Token as a GitHub Actions Secret

The workflow is deployed but needs the token to authenticate. Do this once:

1. Go to **[https://github.com/aairom/aairom.github.io/settings/secrets/actions](https://github.com/aairom/aairom.github.io/settings/secrets/actions)**
2. Click **"New repository secret"**
3. **Name**: `GH_API_TOKEN`
4. **Value**: paste your generated token (e.g., `ghp_...`)
5. Click **"Add secret"**

### Step 6.2 — Trigger the Workflow Manually

1. Go to the **Actions** tab in your repository
2. Click **Fetch GitHub Repos** in the left sidebar
3. Click **Run workflow** → select branch `main` → click **Run workflow**

Within ~30 seconds `repos.json` will be committed and your site will load all repositories with no rate-limit issues.

---

## Phase 7 — Making Future Updates

Every time you make a change, use this 3-command workflow:

```bash
git add .
git commit -m "Describe what you changed"
git push origin main
```

GitHub Pages will automatically rebuild — your changes are live within ~60 seconds.

Or use:
```bash
./scripts/deploy.sh "Describe what you changed"
```

---

## Phase 8 — Custom Domain (Optional)

### Step 8.1 — Buy a domain

Purchase from any registrar: [Namecheap](https://namecheap.com), [Cloudflare Registrar](https://cloudflare.com), [Google Domains](https://domains.google.com).

### Step 8.2 — Create a CNAME file

In your repository root, create a file named `CNAME` (no extension) containing your domain:

```
www.yourdomain.com
```

Push it to GitHub:
```bash
git add CNAME
git commit -m "Add custom domain"
git push origin main
```

### Step 8.3 — Configure your DNS

At your domain registrar's DNS settings, add:

| Type | Host | Value |
|---|---|---|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `CNAME` | `www` | `yourusername.github.io` |

### Step 8.4 — Enable in GitHub Settings

1. **Settings → Pages → Custom domain** → enter `www.yourdomain.com` → Save
2. Check **"Enforce HTTPS"** (free SSL certificate via Let's Encrypt)

DNS propagation takes up to **24–48 hours**.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Site shows 404 | Check that `index.html` is in the repo root; wait 2 min after push |
| Pages not enabled | Go to Settings → Pages and verify branch is set to `main / root` |
| Changes not appearing | Hard-refresh browser (`Ctrl+Shift+R`); check push succeeded |
| Form doesn't send | The default form uses `mailto:` — integrate Formspree for real delivery |
| Mobile menu not working | Ensure `main.js` is linked at the bottom of `index.html` |
