#!/usr/bin/env python3
"""Builds the Tulsi Dental Clinic static site into ../dist.

  python3 build.py            concept build (banner, noindex, booking form does not send)
  python3 build.py --live     production build (no banner, indexable, form opens WhatsApp)
"""
import json, os, sys
from markupsafe import Markup
from jinja2 import Environment, FileSystemLoader, select_autoescape

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, '..', 'dist')
LIVE = '--live' in sys.argv
sys.path.insert(0, HERE)
from data import CLINIC, LOCATIONS, DENTISTS, DENTIST, STAFF, GALLERY, SCHEMES, PRICE_GROUPS, SERVICES, SERVICE, HOME_FAQS

IMG = json.load(open(os.path.join(HERE, 'imgmeta.json')))
env = Environment(loader=FileSystemLoader(os.path.join(HERE, 'templates')), autoescape=select_autoescape(['html']), trim_blocks=True, lstrip_blocks=True)


def img(name, alt, sizes='100vw', cls='', eager=False, attrs=''):
    v = IMG[name]
    src, w, h = v[-1]
    srcset = ', '.join(f'assets/img/{f} {ww}w' for f, ww, hh in v)
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    c = f' class="{cls}"' if cls else ''
    return Markup(f'<img src="assets/img/{src}" srcset="{srcset}" sizes="{sizes}" width="{w}" height="{h}" alt="{Markup.escape(alt)}" {load} decoding="async"{c} {attrs}>')


def full(name):
    return 'assets/img/' + IMG[name][-1][0]


def icon(name, cls='icon'):
    return Markup(f'<svg class="{cls}" aria-hidden="true"><use href="#i-{name}"></use></svg>')


def ld(obj):
    return Markup('<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>')


def org_ld():
    out = []
    for loc in LOCATIONS:
        o = {
            "@context": "https://schema.org", "@type": "Dentist",
            "name": f"{CLINIC['name']}, {loc['short']}", "url": CLINIC['domain'], "telephone": loc['tel'],
            "image": CLINIC['domain'] + "assets/img/og-image.jpg",
            "address": {"@type": "PostalAddress", "streetAddress": loc['street'], "addressLocality": "Ajmer", "addressRegion": "Rajasthan", "postalCode": loc['postcode'], "addressCountry": "IN"},
            "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": d.split(','), "opens": o_, "closes": c_} for d, o_, c_ in loc['ld_hours']],
            "sameAs": [CLINIC['facebook'], CLINIC['instagram']],
            "medicalSpecialty": "Dentistry",
        }
        if loc['geo']:
            o["geo"] = {"@type": "GeoCoordinates", "latitude": loc['geo'][0], "longitude": loc['geo'][1]}
        out.append(o)
    return out


def faq_ld(faqs):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}


def crumbs_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": CLINIC['domain'] + (u if u != 'index.html' else '')} for i, (n, u) in enumerate(items)]}


env.globals.update(img=img, icon=icon, full=full, ld=ld, C=CLINIC, LOCATIONS=LOCATIONS, DENTISTS=DENTISTS, DENTIST=DENTIST, STAFF=STAFF, GALLERY=GALLERY, SCHEMES=SCHEMES, PRICE_GROUPS=PRICE_GROUPS, SERVICES=SERVICES, SERVICE=SERVICE, HOME_FAQS=HOME_FAQS, LIVE=LIVE)

pages = [
    ('index.html', 'index.html', dict(active='home', title='Tulsi Dental Clinic Ajmer | NABH-Accredited Dentist', desc='NABH-accredited dental clinic in Ajmer. Cashless for CGHS, RGHS and ECHS members. Six dentists, two clinics. Book free on WhatsApp or call.', jsonld=org_ld() + [faq_ld(HOME_FAQS)])),
    ('services.html', 'services.html', dict(active='services', title='Dental Treatments in Ajmer | Tulsi Dental Clinic', desc='Root canals, implants, fillings, dentures, wisdom tooth removal, cleaning, veneers and whitening at Tulsi Dental Clinic, Ajmer, with starting prices.', jsonld=[crumbs_ld([('Home', 'index.html'), ('Treatments', 'services.html')])])),
    ('schemes-prices.html', 'schemes-prices.html', dict(active='schemes', title='CGHS, RGHS & ECHS Dental Care and Prices in Ajmer | Tulsi', desc='Use your CGHS, RGHS or ECHS card for cashless dental treatment in Ajmer. Documents, referrals, covered treatments and our full price list.', jsonld=[crumbs_ld([('Home', 'index.html'), ('Schemes and prices', 'schemes-prices.html')])])),
    ('about-us.html', 'about-us.html', dict(active='about', title='About Us and Our Team | Tulsi Dental Clinic, Ajmer', desc='Meet the six dentists and team at Tulsi Dental Clinic, an NABH-accredited dental clinic in Ajmer since 2009.', jsonld=[crumbs_ld([('Home', 'index.html'), ('About us', 'about-us.html')])])),
    ('gallery.html', 'gallery.html', dict(active='gallery', title='Photo Gallery | Tulsi Dental Clinic, Ajmer', desc='Photos of our Ramganj clinic, treatment rooms, team training and Indian Dental Association events.', jsonld=[crumbs_ld([('Home', 'index.html'), ('Gallery', 'gallery.html')])])),
    ('contact.html', 'contact.html', dict(active='contact', title='Contact and Timings | Tulsi Dental Clinic, Ajmer', desc='Addresses, opening hours, phone, WhatsApp and directions for our Ramganj and Chandravardai Nagar clinics in Ajmer.', jsonld=org_ld())),
    ('book.html', 'book.html', dict(active='book', title='Book an Appointment | Tulsi Dental Clinic, Ajmer', desc='Book a free dental appointment at Tulsi Dental Clinic, Ajmer. We confirm your slot on WhatsApp.', jsonld=[])),
    ('privacy.html', 'privacy.html', dict(active='', title='Privacy Policy | Tulsi Dental Clinic', desc='How Tulsi Dental Clinic collects and uses personal data from this website.', jsonld=[])),
]

os.makedirs(DIST, exist_ok=True)
for tpl, out, ctx in pages:
    html = env.get_template(tpl).render(page=out, **ctx)
    open(os.path.join(DIST, out), 'w').write(html)

for s in SERVICES:
    ctx = dict(active='services', s=s, title=f"{s['title']} | Tulsi Dental Clinic", desc=s['intro'][:150].rsplit(' ', 1)[0] + '.',
               jsonld=[crumbs_ld([('Home', 'index.html'), ('Treatments', 'services.html'), (s['name'], s['slug'] + '.html')]), faq_ld(s['faqs']),
                       {"@context": "https://schema.org", "@type": "MedicalWebPage", "name": s['title'], "about": {"@type": "MedicalProcedure", "name": s['name']}, "lastReviewed": "2026-11-01", "reviewedBy": {"@type": "Organization", "name": CLINIC['name']}}])
    html = env.get_template('treatment.html').render(page=s['slug'] + '.html', **ctx)
    open(os.path.join(DIST, s['slug'] + '.html'), 'w').write(html)

# Old URL that every service card on the current site points to (returns 404 today)
open(os.path.join(DIST, 'blog-single.html'), 'w').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=services.html"><link rel="canonical" href="' + CLINIC['domain'] + 'services.html"></head><body><p>This page has moved to <a href="services.html">our treatments</a>.</p></body></html>')

urls = [p[1] for p in pages if p[1] != 'privacy.html'] + [s['slug'] + '.html' for s in SERVICES]
open(os.path.join(DIST, 'sitemap.xml'), 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{CLINIC["domain"]}{"" if u == "index.html" else u}</loc></url>\n' for u in urls) + '</urlset>\n')
open(os.path.join(DIST, 'robots.txt'), 'w').write(('User-agent: *\nAllow: /\nSitemap: ' + CLINIC['domain'] + 'sitemap.xml\n') if LIVE else 'User-agent: *\nDisallow: /\n')
print('built', len(pages) + len(SERVICES), 'pages', 'LIVE' if LIVE else 'CONCEPT')
