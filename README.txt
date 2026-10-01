IONTECH LENOVO CATALOG - WEBSITE
================================
This folder is the public website. Upload everything in it to GitHub.

What's on the site
------------------
- Catalog with two tabs: Onhand and Incoming.
- Filters for category, CPU brand, RAM and GPU, plus a search that updates as you type.
- Five sort options, and a grid or list view.
- A Copy button on every product card. One click copies the model, MTM, specs, SRP and DP.
- Product pages with a photo gallery, SRP, Promo SRP, DP, bundle, full PSREF specs,
  and RAM/SSD upgrade info.
- Also on product pages: PSREF and PDF datasheet links, a QR code and share link,
  and suggested alternatives (hidden on phones).
- Export all models to Excel or PDF (Export button above the product list).
- Compare up to 4 models side by side.
- A New Arrivals banner (one slide per model, from the price list's "New Arrival" tab)
  and price-update alerts (the bell icon).
- After someone opens the site once, it keeps working with no internet connection.

Hosting on GitHub Pages
-----------------------
1. Create a repository, then click "uploading an existing file".
   Drag in everything inside this folder and click Commit changes.
2. Go to Settings > Pages. Set Source to Deploy from a branch, choose main and / (root),
   then click Save.
3. Your site will be at https://YOUR-USERNAME.github.io/REPO-NAME/

Updating prices
---------------
Use the separate "Admin Tool (do not upload)" folder on your computer.
Its README explains the steps. It gives you a new products.json,
which you upload into this repository's data folder.

Files
-----
index.html, styles.css, app.js   the website
sw.js                            offline support
data/products.json               the catalog (the file you replace to update prices)
data/products.js                 a copy used only when index.html is opened from disk
vendor/                          QR code generator and Excel writer
img/, icons/                     logos
