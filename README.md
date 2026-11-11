# Tulsi Dental Clinic website (redesign)

A static, mobile-first website: plain HTML, one CSS file and one small JS file.
It has no framework and no database, so it can run on any web host.

## What's inside

- `dist/`: the finished website. Upload the contents of this folder to the web root.
- `src/data.py`: all content, including prices, hours, dentists, treatments, schemes and FAQs. Edit here.
- `src/templates/`: page layouts (Jinja2).
- `src/build.py`: rebuilds every page in `dist/` from the data and templates.
- `dist/assets/`: CSS, JS, self-hosted fonts (Anek Latin and Mukta, OFL licence), images (WebP), favicon.

## Build

```
pip install jinja2
python3 src/build.py          # concept build: banner, noindex, booking form sends nothing
python3 src/build.py --live   # production build: no banner, indexable, booking opens WhatsApp
```

## Before going live

1. Replace the sample data in `src/data.py`: prices, opening hours, dentist credentials and scheme rules. These are placeholders.
2. Update `HOURS` at the top of `dist/assets/js/site.js` to match the real timings. It drives the live "Open now" status.
3. Fill in the grievance officer's name in `src/templates/privacy.html`.
4. Run `python3 src/build.py --live` and upload `dist/`.
5. Add Google Analytics 4 (not included) and verify the site in Google Search Console. Submit `sitemap.xml`.
6. Point both Google Business Profiles to `book.html`.

## URLs

Old URLs keep working: `index.html`, `about-us.html`, `services.html`, `gallery.html` and `contact.html` keep the same names.
`blog-single.html`, which the old service cards linked to and which returns a 404 today, now redirects to `services.html`.
New pages: one per treatment, plus `schemes-prices.html`, `book.html` and `privacy.html`.

## Notes

- The booking form needs no backend. In the live build it composes a WhatsApp message to +91 77330 07007 and the patient taps send.
- Maps load only when the visitor taps "Show map", which saves mobile data.
- Each page includes structured data: Dentist for both locations, FAQPage, BreadcrumbList and MedicalWebPage.
- Patient testimonials and before/after photos are left out on purpose. A National Dental Commission advisory (Oct 2026) flags both as unethical publicity.
