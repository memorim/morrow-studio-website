# Morrow Studio — Agency Website

Responsive studio presentation with project filters, navigation and a client-validated contact form.

[Open gallery](https://memorim.github.io/morrow-studio-website/)

![Desktop composition](docs/desktop.png)

<img src="docs/mobile.png" width="320" alt="Mobile composition">

## Implementation

HTML, CSS and browser JavaScript; no build framework. The gallery can be served directly; no application build or secret configuration is needed. Desktop and mobile compositions are separate assets.

## Local setup and checks

```bash
node --check script.js
python tests/check_assets.py
python .github/scripts/check_docs.py
python -m http.server 8080 --bind 127.0.0.1
```

Use Python 3.12.14, matching CI. Open `http://localhost:8080`. CI checks asset references and documentation; it does not certify interactive behavior inside images.

## Scope and limits

The contact form validates locally; it does not send email or create a server enquiry. No backend or analytics is implied.

No database, migrations or API are required for this static scope. Forms or integrations would be a separate implementation task.

[Technical details](docs/TECHNICAL.md) · [Recorded checks](docs/VERIFICATION.md) · [Change history](CHANGELOG.md)
