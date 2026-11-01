#!/usr/bin/env python3
"""Builds plentovo-signatures.html from markets.json. Add a country = add a row there."""
import json, html, pathlib
here = pathlib.Path(__file__).parent
D = json.loads((here / "markets.json").read_text())
C = D["company"]; I = D["i18n"]
e = html.escape
LIVE = [m for m in D["markets"] if m["status"] == "live"]

def serving(lang):
    t = I[lang]
    names = [m["name"].get(lang) or m["name"]["en"] for m in LIVE]
    if len(names) <= 3:
        lst = names[0] if len(names) == 1 else t["and"].join([", ".join(names[:-1]), names[-1]]) if len(names) > 2 else t["and"].join(names)
        return t["serving"].format(list=lst)
    return t["serving_n"].format(n=len(names))

def sig(sid, name, tag, email, phone, url, url_label, lang, legal_lines):
    t = I[lang]; rtl = t["dir"] == "rtl"
    d = ' dir="rtl"' if rtl else ""; al = "text-align:right;" if rtl else ""
    ph = f'<span dir="ltr">{e(phone)}</span>'
    ls = "".join(f'<div style="font-size:11px;color:#8a8a8a;">{l}</div>' for l in legal_lines)
    return f'''<div class="mail"{d} style="{al}">{e(t["greet"])}</div>
    <div id="{sid}"{d} style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#171b20;margin-top:10px;{al}">
      <div style="font-size:17px;font-weight:bold;color:#171b20;letter-spacing:0.3px;">{e(name)}</div>
      <div style="font-size:13px;font-weight:bold;color:#da292b;">{e(tag)}</div>
      <div style="height:8px;line-height:8px;">&nbsp;</div>
      <div style="color:#444444;"><a href="mailto:{email}" style="color:#444444;text-decoration:none;">{email}</a> &nbsp;·&nbsp; {ph}</div>
      <div><a href="{url}" style="color:#da292b;font-weight:bold;text-decoration:none;">{e(url_label)}</a></div>
      <div style="height:8px;line-height:8px;">&nbsp;</div>
      {ls}
      <div class="hdr" style="margin:12px 0 0;"><a href="{C["site"]}"><img src="{C["site"]}/brand/plentovo-header.gif" alt="Plentovo" width="480" style="display:block;width:480px;max-width:100%;height:auto;border:0;"></a></div>
    </div>'''

cards = []
def add(title, body, sid):
    cards.append(f'''  <div class="card">
    <h2>{e(title)}</h2>
    {body}
    <label class="opt"><input type="checkbox" checked onchange="hdr('{sid}',this)"> Include header image</label>
    <button onclick="copySig('{sid}',this)">Copy signature</button><span class="ok">Copied</span>
  </div>''')

legal_en = [f'{e(C["legal"])} &nbsp;·&nbsp; Reg. {C["reg"]}', e(C["address"])]
n = 0
for r in D["global_roles"]:
    n += 1; sid = f'sig-{r["key"]}'
    add(f'{n} · {r["key"]}@plentovo.com (generic)',
        sig(sid, r["name"], r["tag"], f'{r["key"]}@plentovo.com', C["phone"], C["site"], "plentovo.com", "en", legal_en), sid)
    if r["key"] == "accounts":
        p = D["person"]; n += 1; sid = f'sig-{p["key"]}'
        add(f'{n} · {p["name"]} (personal)', sig(sid, p["name"], p["tag"], p["email"], C["phone"], C["site"], "plentovo.com", "en", legal_en), sid)

for m in LIVE:
    for lang in m["langs"]:
        t = I[lang]
        legal = [e(t["brand_of"].format(legal=C["legal"], reg=C["reg"]))]
        for role in D["market_roles"]:
            n += 1; sid = f'sig-{m["code"]}-{role}-{lang}'
            nm, tg = t["roles"][role]
            path = m["path"].get(lang, "")
            add(f'{n} · {m["name"]["en"]} · {role}@ ({lang.upper()})',
                sig(sid, nm, tg, f'{role}@plentovo.com', m["phone"] or C["phone"], C["site"] + path,
                    "plentovo.com" + (path.rsplit("/", 1)[0] if path else ""), lang, legal), sid)

src = (here / "page_template.html").read_text()
(here / "out" / "plentovo-signatures.html").write_text(src.replace("<!--CARDS-->", "\n\n".join(cards)).replace("<!--COUNT-->", str(n)))
print("signatures:", n)
