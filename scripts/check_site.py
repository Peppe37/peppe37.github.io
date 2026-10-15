#!/usr/bin/env python3
"""Checks the portfolio before it is published. Exits with 1 if anything is wrong.

    python3 scripts/check_site.py [--cv]      (--cv also checks the generated PDFs)

What it checks:
  - every data-i18n key in the page exists in both languages, and the two languages have the same keys
  - every local file the page points to exists (the CV PDFs are generated, so only with --cv)
  - the page basics: one h1, a title, a description, alt text on images, rel="noopener" on external links
  - the structured data parses
  - nothing that must not go public: the phone number, placeholder text
  - size budgets: images and the whole site
  - with --cv: each PDF has exactly one page and no phone number in its text
"""
import json, os, re, subprocess, sys
from html.parser import HTMLParser

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SITE = os.path.join(ROOT, "site")
errors = []

def fail(msg):
    errors.append(msg)
    print("FAIL", msg)

def ok(msg):
    print("ok  ", msg)

def read(*parts):
    with open(os.path.join(SITE, *parts), encoding="utf-8") as f:
        return f.read()

# ---------- parse the page ----------
class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.i18n, self.refs, self.h1, self.imgs_without_alt = [], [], 0, []
        self.bad_links, self.title, self._in_title, self.meta = [], "", False, {}
    def handle_starttag(self, tag, a):
        a = dict(a)
        if "data-i18n" in a: self.i18n.append(a["data-i18n"])
        if tag == "h1": self.h1 += 1
        if tag == "title": self._in_title = True
        if tag == "meta" and a.get("name"): self.meta[a["name"]] = a.get("content", "")
        if tag == "img" and not a.get("alt"): self.imgs_without_alt.append(a.get("src", "?"))
        for k in ("src", "href"):
            if k in a and a[k]:
                self.refs.append(a[k])
        if tag == "a" and a.get("target") == "_blank" and "noopener" not in a.get("rel", ""):
            self.bad_links.append(a.get("href", "?"))
    def handle_endtag(self, tag):
        if tag == "title": self._in_title = False
    def handle_data(self, d):
        if self._in_title: self.title += d

html = read("index.html")
page = Page(); page.feed(html)

# ---------- translations ----------
def load_translations():
    """Runs site/js/i18n.js in node and returns the two dictionaries (so that strings are never mistaken for keys)."""
    code = "global.window = {}; require(process.argv[1]); process.stdout.write(JSON.stringify(window.PORTFOLIO_I18N));"
    out = subprocess.run(["node", "-e", code, os.path.join(SITE, "js", "i18n.js")], capture_output=True, text=True)
    if out.returncode != 0:
        fail("site/js/i18n.js does not run: " + out.stderr.strip()[:300]); return {}
    return json.loads(out.stdout)

translations = load_translations()
en, it = set(translations.get("en", {})), set(translations.get("it", {}))
if not en or not it: fail("could not read the two languages from site/js/i18n.js")
else:
    used = set(page.i18n)
    for lang, keys in (("en", en), ("it", it)):
        missing = sorted(used - keys)
        if missing: fail(f"{lang}: keys used in index.html but not translated: {', '.join(missing)}")
    if en - it: fail(f"in English only: {', '.join(sorted(en - it))}")
    if it - en: fail(f"in Italian only: {', '.join(sorted(it - en))}")
    unused = sorted((en | it) - used - {"roles"})
    if unused: fail(f"translated but never used in index.html: {', '.join(unused)}")
    if not errors: ok(f"translations: {len(used)} keys used, {len(en)} in each language")

# ---------- local references ----------
with_cv = "--cv" in sys.argv
missing = []
for ref in page.refs:
    if re.match(r"^(https?:|mailto:|tel:|#|data:)", ref): continue
    path = ref.split("#")[0].split("?")[0]
    if not path: continue
    if path.startswith("assets/cv/") and not with_cv: continue
    if not os.path.exists(os.path.join(SITE, path)): missing.append(path)
if missing: fail("files referenced but missing: " + ", ".join(sorted(set(missing))))
else: ok(f"{len(page.refs)} references checked")
for f in ("robots.txt", "sitemap.xml", "404.html", "assets/og.png", "assets/favicon.svg"):
    if not os.path.exists(os.path.join(SITE, f)): fail(f"missing site/{f}")

# ---------- page basics ----------
if page.h1 != 1: fail(f"the page needs exactly one h1, it has {page.h1}")
if not page.title.strip(): fail("empty <title>")
if len(page.meta.get("description", "")) < 50: fail("meta description missing or too short")
if page.imgs_without_alt: fail("images without alt text: " + ", ".join(page.imgs_without_alt))
if page.bad_links: fail("target=_blank links without rel=noopener: " + ", ".join(page.bad_links))
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
    try: json.loads(block)
    except ValueError as e: fail(f"structured data is not valid JSON: {e}")
ok("page basics")

# ---------- what must not be public ----------
FORBIDDEN = [r"366[\s.-]?713[\s.-]?1421", r"\blorem ipsum\b", r"example\.com", r"\bTODO\b", r"\bFIXME\b"]
for root, _, files in os.walk(SITE):
    for name in files:
        if name.endswith((".html", ".js", ".css", ".xml", ".txt", ".svg")):
            text = open(os.path.join(root, name), encoding="utf-8").read()
            for pat in FORBIDDEN:
                if re.search(pat, text, re.I): fail(f"{os.path.relpath(os.path.join(root, name), ROOT)} contains a forbidden pattern: {pat}")
ok("no forbidden text")

# ---------- size budgets ----------
total = 0
for root, _, files in os.walk(SITE):
    for name in files:
        size = os.path.getsize(os.path.join(root, name)); total += size
        if name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")) and size > 400_000:
            fail(f"{name} is {size // 1000} KB: images stay under 400 KB")
if total > 3_000_000: fail(f"the site is {total // 1000} KB: the budget is 3 MB")
else: ok(f"site size {total // 1000} KB")

# ---------- CV PDFs ----------
if with_cv:
    for lang in ("en", "it"):
        path = os.path.join(SITE, "assets", "cv", f"Giuseppe-Lapietra-CV-{lang}.pdf")
        if not os.path.exists(path): fail(f"missing {path}"); continue
        pages = len(re.findall(rb"/Type\s*/Page[^s]", open(path, "rb").read()))
        if pages != 1: fail(f"CV {lang} has {pages} pages: it must fit on one")
        try:
            text = subprocess.run(["pdftotext", path, "-"], capture_output=True, text=True, check=True).stdout
            if not re.search(r"Lapietra", text): fail(f"CV {lang}: text not readable")
            if re.search(FORBIDDEN[0], text): fail(f"CV {lang} contains the phone number")
            if "Carbonium" in text or "carbonium" in text: fail(f"CV {lang} still mentions Carbonium")
        except FileNotFoundError:
            print("skip", "pdftotext not installed: PDF text not checked")
    if not any("CV" in e for e in errors): ok("CV PDFs: one page each")

print()
if errors:
    print(f"{len(errors)} problem(s)")
    sys.exit(1)
print("all good")
