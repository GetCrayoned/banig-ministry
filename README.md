# 🌿 Banig Ministry Web App

A responsive, single-page web application for **Banig Ministry** — manage events, attendance, weekly devotionals, song lyrics, and tithes/offering QR codes all in one place.

> 🌐 **Live Site:** [https://banigministry.org](https://banigministry.org) *(after deployment)*

---

## ✨ Features

| Feature | Description |
|---|---|
| 📅 **Events** | Add, edit, and filter upcoming & past events with categories |
| ✅ **Attendance** | Log attendance per session; track unique members |
| 📖 **Devotionals** | Write weekly devotionals with Bible verse, reflection & prayer |
| 🎵 **Song Repository** | Store song lyrics with key, language, tags, and links |
| 💝 **Tithes & Offering** | Display QR codes (GCash, PayMaya, etc.) for giving |
| ⚙️ **Settings** | Ministry info + export/import data as JSON backup |

---

## 🚀 Deploying to GitHub Pages with a Custom `.org` Domain

### Step 1 — Push to GitHub

```bash
cd banig-ministry
git init
git add .
git commit -m "Initial commit: Banig Ministry webapp"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/banig-ministry.git
git push -u origin main
```

### Step 2 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select **GitHub Actions**
4. The workflow in `.github/workflows/deploy.yml` will auto-deploy on every push to `main`

### Step 3 — Add Your Custom `.org` Domain

#### A. Create a `CNAME` file

In the root of your repository, create a file named `CNAME` (no extension) with your domain:

```
banigministry.org
```

Then commit and push it:

```bash
echo "banigministry.org" > CNAME
git add CNAME && git commit -m "Add custom domain" && git push
```

#### B. Configure DNS at your domain registrar

Add these DNS records with your `.org` domain registrar (e.g., GoDaddy, Namecheap, Google Domains):

**For apex domain (`banigministry.org`)** — add 4 A records:
```
Type: A   Host: @   Value: 185.199.108.153
Type: A   Host: @   Value: 185.199.109.153
Type: A   Host: @   Value: 185.199.110.153
Type: A   Host: @   Value: 185.199.111.153
```

**For `www` subdomain** — add a CNAME record:
```
Type: CNAME   Host: www   Value: YOUR_USERNAME.github.io
```

#### C. Verify in GitHub Settings

1. Go to **Settings → Pages** in your repo
2. Under **Custom domain**, enter `banigministry.org`
3. Check **Enforce HTTPS** (available after DNS propagates, ~24–48 hours)

---

## 💾 Data Storage

All data is stored in your browser's **localStorage** — no backend server needed! This means:
- ✅ Works fully offline
- ✅ Free to host (GitHub Pages)
- ⚠️ Data is per-device/per-browser — use **Export Data** in Settings to back up

### Backup & Restore
- Go to **Settings → Export Data** to download a `.json` backup
- Use **Import Data** to restore from a backup file

---

## 📁 Project Structure

```
banig-ministry/
├── index.html              # Main app (single page)
├── css/
│   └── style.css           # All styles
├── js/
│   └── app.js              # All logic (vanilla JS)
├── CNAME                   # Custom domain (create after setup)
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions auto-deploy
└── README.md
```

---

## 🛠 Local Development

No build tools needed! Just open in a browser:

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a simple local server
npx serve .
# or
python3 -m http.server 8080
```

---

## 🎨 Customization

- **Colors**: Edit CSS variables at the top of `css/style.css` (`:root { ... }`)
- **Ministry name**: Update in `index.html` title/logo area or via the Settings page in the app
- **Logo**: Replace the 🌿 emoji in `index.html` or add an `<img>` tag

---

## 📝 License

Free to use for ministry and non-commercial purposes. God bless! 🙏
