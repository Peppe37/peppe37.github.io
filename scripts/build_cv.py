#!/usr/bin/env python3
"""Builds assets/cv/Giuseppe-Lapietra-CV-{en,it}.pdf from the data below, with headless Chrome.

Usage: python3 scripts/build_cv.py
The CV carries the email, the city and the date of birth, but not the phone number.
"""
import html, os, subprocess, tempfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

DATA = {
  "en": {
    "lang": "en", "title": "Software developer",
    "contact": [("Email", "lapietra.giu@gmail.com"), ("LinkedIn", "linkedin.com/in/giuseppe-lapietra"), ("GitHub", "github.com/Peppe37"),
                ("Portfolio", "peppe37.github.io"), ("Based in", "Palo del Colle (BA), Italy"), ("Born", "14 August 2003")],
    "h_profile": "Profile",
    "profile": "Software developer with experience in full-stack development and embedded systems. Passionate about innovation, with experience building scalable software and optimising performance. Currently completing a BSc in Computer Science at the University of Bari.",
    "h_exp": "Experience",
    "exp": [
      ("Software developer", "GD Services · Rome (gdservices.tech)", "Nov 2025 – present",
       ["Backend software development and maintenance (Python and React).", "Design of APIs and MCP servers.", "AI solutions in the Research and Development team."]),
      ("Software developer", "Innovabile SRL · Palo del Colle (foodu.it)", "Oct 2022 – Dec 2023 (1 year 3 months)",
       ["Full-stack development and maintenance (Python and Django, AWS, React).", "API design and cross-platform performance tuning.", "Debugging and bug fixing for scalability and security."]),
    ],
    "h_proj": "Selected projects",
    "proj": [
      ("Notcholino", "Open-source macOS app (Swift): a notch with now playing, calendar, file shelf and a plugin system with its own store.", "peppe37.github.io/Notcholino"),
      ("p8s", "Async Python framework combining Django's developer experience with FastAPI's speed, AI-native.", "github.com/Peppe37/p8s"),
      ("tap", "Self-hosted, open-source package tracking across several carriers.", "github.com/Peppe37/tap"),
      ("Websites", "Poliba Corse (Formula SAE team), MusicaInGioco (social orchestra), and my own products Printingarage and GymBoard.", "peppe37.github.io"),
    ],
    "h_edu": "Education",
    "edu": [
      ("BSc in Computer Science (L-31)", "University of Bari Aldo Moro", "2022 – present"),
      ("Scientific high school diploma", "Liceo Scientifico E. Amaldi · Bitetto (BA)", ""),
      ("Arduino certification", "Liceo Amaldi · Bitetto (BA)", ""),
      ("English, Cambridge certificate B1", "", ""),
    ],
    "h_more": "Other experience",
    "more": [
      ("Member, Poliba Corse", "Politecnico di Bari Formula SAE team · Sep 2023 – present", "Developing the new website of the team."),
      ("INFN internship", "Frascati National Laboratories · May 2022", "Data analysis and automation in Python."),
      ("Work-experience programme", "Sitael (Mola di Bari) and Liceo Amaldi · 2020-2021", "Robotics projects and embedded systems."),
    ],
    "h_skills": "Skills",
    "skills": [("Languages", "Python, C, C++, C#, Java, JavaScript, TypeScript, Swift, Rust, SQL, HTML5, CSS"),
               ("Web and AI", "Django, FastAPI, React, REST APIs, MCP servers, AWS, Docker, LLM agents, vector databases"),
               ("Software", "Fusion 360, Adobe Suite, Office, Git"),
               ("Soft skills", "Problem solving, precision, leadership, determination, punctuality")],
    "h_pers": "Personal",
    "pers": "Musician (guitar, violin, piano). Innovation: making and DIY, founder of \"carbonium-team\" and \"print.in.garage\". Sport: bodybuilding, basketball, motorsport. Own car.",
    "file": "Giuseppe-Lapietra-CV-en.pdf",
  },
  "it": {
    "lang": "it", "title": "Sviluppatore software",
    "contact": [("Email", "lapietra.giu@gmail.com"), ("LinkedIn", "linkedin.com/in/giuseppe-lapietra"), ("GitHub", "github.com/Peppe37"),
                ("Portfolio", "peppe37.github.io"), ("Provenienza", "Palo del Colle (BA)"), ("Nato il", "14/08/2003")],
    "h_profile": "Profilo",
    "profile": "Sviluppatore software con esperienza in sviluppo full-stack e sistemi embedded. Appassionato di innovazione, con esperienza nella creazione di soluzioni software scalabili e nell'ottimizzazione delle performance. Attualmente laureando in Informatica presso l'Università di Bari.",
    "h_exp": "Esperienze professionali",
    "exp": [
      ("Sviluppatore software", "GD Services · Roma (gdservices.tech)", "Novembre 2025 – in corso",
       ["Sviluppo e manutenzione di software backend (Python + React).", "Progettazione di API e server MCP.", "Sviluppo di soluzioni AI nel team di Ricerca e Sviluppo."]),
      ("Sviluppatore software", "Innovabile SRL · Palo del Colle (foodu.it)", "Ottobre 2022 – Dicembre 2023 (1 anno e 3 mesi)",
       ["Sviluppo e manutenzione di software full-stack (Python + Django, AWS, React).", "Progettazione di API e ottimizzazione delle performance multipiattaforma.", "Debugging e risoluzione di bug per garantire scalabilità e sicurezza."]),
    ],
    "h_proj": "Progetti in evidenza",
    "proj": [
      ("Notcholino", "App macOS open source (Swift): un notch con musica in riproduzione, calendario, mensola per i file e un sistema di plugin con il suo store.", "peppe37.github.io/Notcholino"),
      ("p8s", "Framework Python asincrono che unisce l'esperienza di Django alla velocità di FastAPI, nativo per l'AI.", "github.com/Peppe37/p8s"),
      ("tap", "Tracciamento pacchi self-hosted e open source su più corrieri.", "github.com/Peppe37/tap"),
      ("Siti web", "Poliba Corse (team Formula SAE), MusicaInGioco (orchestra sociale) e i miei prodotti Printingarage e GymBoard.", "peppe37.github.io"),
    ],
    "h_edu": "Percorso di studi",
    "edu": [
      ("Laureando in Informatica (L-31)", "Università degli studi Aldo Moro · Bari (BA)", "dal 2022 – in corso"),
      ("Diploma di Liceo Scientifico", "Liceo Amaldi · Bitetto (BA)", ""),
      ("Certificazione Arduino", "Liceo Amaldi · Bitetto (BA)", ""),
      ("Inglese, certificazione Cambridge B1", "", ""),
    ],
    "h_more": "Altre esperienze",
    "more": [
      ("Membro del Poliba Corse", "Università degli studi Aldo Moro · Settembre 2023 – in corso", "Sviluppo del nuovo sito per il Team di Formula SAE del Politecnico di Bari."),
      ("Stage scolastico INFN", "Laboratori Nazionali di Frascati · Maggio 2022", "Analisi dati e automazione in Python."),
      ("PCTO", "Sitael (Mola di Bari) e Liceo Amaldi · a.s. 2020-2021", "Progetti di robotica e sistemi embedded."),
    ],
    "h_skills": "Competenze tecniche",
    "skills": [("Linguaggi", "Python, C, C++, C#, Java, JavaScript, TypeScript, Swift, Rust, SQL, HTML5, CSS"),
               ("Web e AI", "Django, FastAPI, React, API REST, server MCP, AWS, Docker, agenti LLM, database vettoriali"),
               ("Software", "Fusion 360, Adobe Suite, Pacchetto Office, Git"),
               ("Soft skills", "Problem-solving, precisione, leadership, determinazione, puntualità")],
    "h_pers": "Personale",
    "pers": "Musicista (chitarra, violino, pianoforte). Innovazione: making e DIY, founder di \"carbonium-team\" e \"print.in.garage\". Sport: bodybuilding, basket, motorsport. Automunito.",
    "file": "Giuseppe-Lapietra-CV-it.pdf",
  },
}

CSS = """
@page { size: A4; margin: 11mm 14mm; }
* { box-sizing: border-box; }
body { font: 8.9pt/1.36 -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1d1d1f; margin: 0; }
header { border-bottom: 2px solid #0a6cff; padding-bottom: 7px; margin-bottom: 6px; }
h1 { font-size: 22pt; margin: 0; letter-spacing: -.02em; }
.role { color: #0a6cff; font-weight: 600; font-size: 10.5pt; margin: 0 0 5px; }
.contact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 14px; font-size: 8pt; color: #444; white-space: nowrap; }
.contact b { color: #1d1d1f; font-weight: 600; }
h2 { font-size: 9.6pt; text-transform: uppercase; letter-spacing: .09em; color: #0a6cff; margin: 8px 0 4px; break-after: avoid; border-bottom: 1px solid #d9d9de; padding-bottom: 2px; }
.row { display: flex; justify-content: space-between; gap: 12px; }
.row b { font-size: 9.4pt; }
.when { color: #6e6e73; font-size: 8.8pt; white-space: nowrap; }
.org { color: #555; margin-bottom: 1px; }
ul { margin: 1px 0 4px; padding-left: 14px; }
li { margin: 0; }
.item { margin-bottom: 4px; break-inside: avoid; }
p { margin: 0 0 4px; }
.skills { display: grid; grid-template-columns: 24mm 1fr; gap: 2px 10px; }
.skills b { font-weight: 600; }
.small { color: #444; }
"""

def block(d):
    e = html.escape
    out = [f"<!doctype html><html lang='{d['lang']}'><head><meta charset='utf-8'><style>{CSS}</style></head><body>",
           f"<header><h1>Giuseppe Lapietra</h1><div class='role'>{e(d['title'])}</div><div class='contact'>"]
    out += [f"<div><b>{e(k)}:</b> {e(v)}</div>" for k, v in d["contact"]]
    out.append("</div></header>")
    out.append(f"<h2>{e(d['h_profile'])}</h2><p>{e(d['profile'])}</p>")
    out.append(f"<h2>{e(d['h_exp'])}</h2>")
    for role, org, when, bullets in d["exp"]:
        out.append(f"<div class='item'><div class='row'><b>{e(role)}</b><span class='when'>{e(when)}</span></div><div class='org'>{e(org)}</div><ul>"
                   + "".join(f"<li>{e(b)}</li>" for b in bullets) + "</ul></div>")
    out.append(f"<h2>{e(d['h_proj'])}</h2>")
    for name, desc, link in d["proj"]:
        out.append(f"<div class='item'><div class='row'><b>{e(name)}</b><span class='when'>{e(link)}</span></div><div class='small'>{e(desc)}</div></div>")
    out.append(f"<h2>{e(d['h_edu'])}</h2>")
    for name, org, when in d["edu"]:
        out.append(f"<div class='row'><span><b>{e(name)}</b>{(' · ' + e(org)) if org else ''}</span><span class='when'>{e(when)}</span></div>")
    out.append(f"<h2>{e(d['h_more'])}</h2>")
    for name, org, desc in d["more"]:
        out.append(f"<div class='item'><b>{e(name)}</b> <span class='small'>· {e(org)}</span><div class='small'>{e(desc)}</div></div>")
    out.append(f"<h2>{e(d['h_skills'])}</h2><div class='skills'>")
    out += [f"<b>{e(k)}</b><span>{e(v)}</span>" for k, v in d["skills"]]
    out.append("</div>")
    out.append(f"<h2>{e(d['h_pers'])}</h2><p>{e(d['pers'])}</p></body></html>")
    return "".join(out)

def main():
    outdir = os.path.join(ROOT, "assets", "cv")
    os.makedirs(outdir, exist_ok=True)
    for d in DATA.values():
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
            f.write(block(d)); path = f.name
        pdf = os.path.join(outdir, d["file"])
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={pdf}", "file://" + path],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.unlink(path)
        print("wrote", pdf)

if __name__ == "__main__":
    main()
