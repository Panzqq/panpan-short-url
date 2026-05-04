# CMD Termux - Update Project PanLink

```bash
cd /storage/emulated/0/Download
unzip panpan-short-url-simple-animated.zip
cd panpan-short-url-simple-animated

git config --global --add safe.directory /storage/emulated/0/Download/panpan-short-url-simple-animated
git config --global user.name "Panzqq"
git config --global user.email "EMAIL_GITHUB_KAMU"

git init
git branch -M main

git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Panzqq/panpan-short-url.git

git add .
git commit -m "Simplify UI and add media tools"
git push -u origin main --force
```

Deploy ulang:

```bash
npm install
vercel --prod
```
