from html.parser import HTMLParser
from pathlib import Path
root=Path(__file__).resolve().parents[1]
class Check(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        for attr in (["src"] if tag in {"script","img"} else ["href"] if tag=="link" and attrs.get("rel")=="stylesheet" else []):
            value=attrs.get(attr,"")
            if value and not value.startswith(("http","data:","#")):
                assert (root/value).is_file(),value
Check().feed((root/"index.html").read_text(encoding="utf-8"))
print("Local assets: OK")
