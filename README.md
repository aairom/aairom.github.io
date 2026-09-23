# 🌐 Personal Website — GitHub Pages

> **🔗 [https://aairom.github.io](https://aairom.github.io) · [📂 Repositories](https://aairom.github.io/#repositories)**
>
> A clean, responsive personal website hosted on **GitHub Pages** — no build tools, no frameworks, no dependencies. Pure HTML, CSS, and vanilla JavaScript.

[![Live Site](https://img.shields.io/badge/Live%20Site-aairom.github.io-blue?style=flat-square)](https://aairom.github.io)
[![Repositories](https://img.shields.io/badge/Repositories-aairom.github.io%2F%23repositories-58a6ff?style=flat-square)](https://aairom.github.io/#repositories)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## ✨ Features

| Feature | Detail |
|---|---|
| **Hero section** | Name, tagline, and call-to-action buttons |
| **About section** | Bio text with avatar placeholder |
| **Skills section** | Four skill cards (Front-End, Back-End, DevOps, Tools) |
| **Portfolio section** | Three project cards with tech tags and links |
| **Contact section** | Validated form + social links |
| **Responsive** | Mobile-first layout using CSS Grid & Flexbox |
| **Accessible** | ARIA labels, skip links, focus rings, reduced-motion |
| **Dark theme** | GitHub-inspired dark palette via CSS custom properties |
| **No dependencies** | Zero npm packages, zero build step required |

---

## 🏗 Architecture

```
username.github.io/
├── index.html          # Entry point — all sections live here
├── styles.css          # All CSS (custom properties, responsive, animations)
├── main.js             # Vanilla JS (nav, form validation, scroll effects)
├── .gitignore
├── Docs/
│   ├── Quickstart.md   # Step-by-step guide for first-time setup
│   └── Architecture.md # Technical architecture and flow diagrams
├── scripts/
│   ├── start.sh        # Serve the site locally (Python HTTP server)
│   ├── deploy.sh       # Git add → commit → push workflow
│   └── cleanup.sh      # Remove generated/temp files
├── input/              # (placeholder — synced but content gitignored)
└── output/             # (placeholder — synced but content gitignored)
```

---

## 🚀 Quick Start

### Prerequisites

- [Git](https://git-scm.com/) installed
- A [GitHub account](https://github.com)
- A text editor (e.g. [VS Code](https://code.visualstudio.com/))

### 1 — Create your GitHub Pages repository

GitHub Pages uses a special naming convention: a repository named **exactly** `<username>.github.io` is automatically served at `https://<username>.github.io`.

```bash
# On github.com:
# New repository → Name: yourusername.github.io
# Visibility: Public  (required for free GitHub Pages)
# ✓ Add a README
# Click "Create repository"
```

> **Why `<username>.github.io`?** GitHub detects this pattern and treats the repo as a "User Site" — the root `index.html` is served directly at your username URL, no subdirectory needed.

### 2 — Clone locally

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

### 3 — Add your files

Copy all files from this project into the cloned folder, then personalise:

| File | What to change |
|---|---|
| `index.html` | Replace every `[Your Name]`, `[City, Country]`, email, project links |
| `styles.css` | Adjust `--clr-accent` in `:root` for your brand colour |
| `main.js` | Swap the `mailto:` with a Formspree endpoint for real form delivery |

### 4 — Preview locally

```bash
# macOS/Linux — Python 3
python3 -m http.server 8080
# then open http://localhost:8080

# Or use the helper script:
chmod +x scripts/start.sh
./scripts/start.sh
```

### 5 — Deploy to GitHub Pages

```bash
git add .
git commit -m "Initial personal website"
git push origin main
```

GitHub Pages deploys automatically within ~60 seconds.  
Visit: **`https://yourusername.github.io`**

> **First-time only:** Go to **Settings → Pages → Source → Deploy from a branch → main / (root)** and click Save.

---

## 🔑 Creating a GitHub Personal Access Token

### What is a Personal Access Token (PAT)?

A **Personal Access Token (PAT)** serves as an alternative to using your GitHub account password for authenticating Git operations over HTTPS (such as `git push` or `git clone`), CLI tools (e.g., `gh`), or GitHub REST/GraphQL API scripts. Since GitHub deprecated account passwords for Git authentication, a PAT is required to authenticate programmatic and command-line access securely.

### Step-by-Step Instructions to Generate a PAT

1. Sign in to your account on [GitHub](https://github.com).
2. Navigate directly to the token management page: **[https://github.com/settings/tokens](https://github.com/settings/tokens)**
   *(Alternatively, click your profile icon in the top right → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**).*
3. Click the **Generate new token** drop-down and choose **Generate new token (classic)** (or create a Fine-grained token depending on your workflow requirements).
4. Enter a descriptive name in the **Note** field (e.g., `github-pages-deployment` or `cli-access`).
5. Choose an **Expiration** period (e.g., `30 days`, `90 days`, or custom duration according to your security policy).

### Selecting Required Scopes and Permissions

Select the scopes based on what tasks you need to perform:

- **For Git command-line access & pushing to repositories:**
  - `repo` (Full control of private repositories, or public repository access)
  - `workflow` (if updating GitHub Actions workflows)
- **For GitHub Pages administration / status:**
  - `repo` (includes `repo:status`, `public_repo`)
- **For reading user profile data:**
  - `read:user`, `user:email`

> 💡 **Principle of Least Privilege:** Only select the permissions strictly necessary for your use case to minimize security risk.

### Storing and Securing Your Token

- Copy the token immediately using the clipboard button.
- Store your token securely in a trusted password manager (e.g., 1Password, Bitwarden, KeePass) or secure secrets manager.
- If using Git CLI over HTTPS, cache credentials with Git Credential Manager or your OS keychain:
  ```bash
  git config --global credential.helper osxkeychain  # macOS
  # or
  git config --global credential.helper store        # Linux/generic (stores in ~/.git-credentials)
  ```
- **Never commit tokens or secrets to version control, `.env` files, or public repositories.**

> ⚠️ **Warning:** GitHub will only display your Personal Access Token **once** upon creation. If you navigate away or refresh the page without copying it, you will not be able to retrieve the value and must regenerate a new token.

### Add Your Token as a GitHub Actions Secret

The repository workflow (`Fetch GitHub Repos`) is deployed to automatically keep repository listings up-to-date, but it needs the token to authenticate with the GitHub API. Do this one-time configuration:

1. Go to **[https://github.com/aairom/aairom.github.io/settings/secrets/actions](https://github.com/aairom/aairom.github.io/settings/secrets/actions)**
2. Click **New repository secret**.
3. Set **Name**: `GH_API_TOKEN`
4. Set **Value**: paste your generated token (e.g. `ghp_...`)
5. Click **Add secret**.

#### Trigger the Workflow Manually:

1. Go to the **Actions** tab in the repository.
2. Select **Fetch GitHub Repos** from the left workflow list.
3. Click **Run workflow** → select branch `main` → click **Run workflow**.

Within ~30 seconds `repos.json` will be committed and your site will load all repositories with no rate-limit issues.

---

## 🔄 Update Workflow

```bash
# 1. Edit your files
# 2. Stage and commit
git add .
git commit -m "Update about section"

# 3. Push — GitHub Pages rebuilds automatically
git push origin main
```

Or use the helper script:
```bash
./scripts/deploy.sh "Update about section"
```

---

## 🌍 Custom Domain (Optional)

1. Purchase a domain from any registrar (e.g. Namecheap, Cloudflare)
2. Create a file `CNAME` in your repo root containing just your domain:
   ```
   www.yourdomain.com
   ```
3. In your DNS provider, add:
   - `A` records pointing to GitHub's IPs (`185.199.108.153`, etc.)
   - Or a `CNAME` record: `www → yourusername.github.io`
4. In GitHub repo **Settings → Pages → Custom domain**, enter your domain

---

## 📬 Contact Form Integration

The form currently uses a `mailto:` fallback. For real submissions, integrate **Formspree** (free tier available):

```javascript
// In main.js, replace the mailto line with:
fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, message })
});
```

---

## 📄 License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

## 🙏 Credits

Built with HTML5, CSS3, and vanilla JavaScript. Hosted free on [GitHub Pages](https://pages.github.com).
