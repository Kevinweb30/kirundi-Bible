# Putting the full Kirundi Bible app on GitHub Pages

This folder is your whole app, ready to publish — the reader, the text for
all 66 books, and a few sample audio files. You just need to (1) drop your
full `compressed` audio folder in, and (2) push it to GitHub.

## 1. Add your audio

Copy **every file** from your `compressed` folder (all ~1,189 mp3s) into
the `audio` folder in this project, replacing the 4 sample files that are
already there. The names should already match exactly
(`GEN_001.mp3`, `1CH_001.mp3`, etc.) — no renaming needed.

## 2. Create a GitHub account (skip if you already have one)

Go to https://github.com/signup and make a free account.

## 3. Create a new repository

- Go to https://github.com/new
- Repository name: `kirundi-bible` (or whatever you like)
- Set it to **Public** (required for free GitHub Pages)
- Don't check any of the "initialize with README" boxes
- Click **Create repository**

GitHub will show you a page with some commands — you don't need those,
just keep the page open to see your repository's web address, something
like `https://github.com/yourname/kirundi-bible`.

## 4. Push this folder to GitHub

Open Terminal, then `cd` into this folder (the one this file is in), and
run these one at a time — replace `yourname` and `kirundi-bible` with your
actual GitHub username and the repository name you picked:

```
git init
git add .
git commit -m "Kirundi Bible app with audio"
git branch -M main
git remote add origin https://github.com/yourname/kirundi-bible.git
git push -u origin main
```

The first push will take a while — you're uploading ~1.5-2GB. Don't close
the Terminal window until it finishes; it's normal for there to be no
visible progress for long stretches.

If it asks you to log in, GitHub will walk you through a browser sign-in
(or ask for a "personal access token" instead of your password — if so,
tell me and I'll walk you through creating one).

## 5. Turn on GitHub Pages

- On your repository's GitHub page, click **Settings** (top right of the repo)
- Click **Pages** in the left sidebar
- Under "Build and deployment" → "Source", choose **Deploy from a branch**
- Branch: `main`, folder: `/ (root)` → **Save**

GitHub will show a message like "Your site is live at
`https://yourname.github.io/kirundi-bible/`" — it can take a few minutes
the first time.

## 6. Send me that link

Once it's live, send me the `github.io` link and I'll do a final check to
make sure every chapter plays correctly from there.
