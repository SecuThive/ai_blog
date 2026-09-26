#!/usr/bin/env python3
"""Compare a local or deployed build with the pre-redesign public SEO baseline.

Usage: python3 scripts/seo-regression.py http://127.0.0.1:3000
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = json.loads((ROOT / "docs/seo/baseline-pages.json").read_text())
SITEMAP_URLS = set(json.loads((ROOT / "docs/seo/baseline-sitemap-urls.json").read_text()))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "ThiveLabSeoRegression/1.0"})
    try:
        with OPENER.open(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", "replace")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.in_jsonld = False
        self.jsonld = ""
        self.metas = []
        self.links = []
        self.schemas = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_jsonld = True
            self.jsonld = ""
        if tag == "meta":
            self.metas.append(attrs)
        if tag == "link":
            self.links.append(attrs)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_jsonld:
            self.in_jsonld = False
            try:
                parsed = json.loads(self.jsonld)
                if isinstance(parsed, dict):
                    self.schemas.append(parsed)
            except json.JSONDecodeError:
                pass

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_jsonld:
            self.jsonld += data

    def meta(self, name):
        return next((x.get("content", "") for x in self.metas if x.get("name") == name or x.get("property") == name), "")

    def link(self, rel):
        return next((x.get("href", "") for x in self.links if x.get("rel") == rel), "")


def inspect(html):
    parser = PageParser()
    parser.feed(html)
    core = []
    for schema in parser.schemas:
        if schema.get("@type") in ("Article", "TechArticle"):
            core.append({key: schema[key] for key in ("@type", "headline", "datePublished", "dateModified", "mainEntityOfPage") if key in schema})
    return {
        "title": parser.title,
        "description": parser.meta("description"),
        "robots": parser.meta("robots"),
        "canonical": parser.link("canonical"),
        "og_url": parser.meta("og:url"),
        "twitter_card": parser.meta("twitter:card"),
        "schema_types": [schema.get("@type", "") for schema in parser.schemas],
        "schema_core": core,
    }


def main(base):
    failures = []
    for expected in PAGES:
        parsed_url = urllib.parse.urlsplit(expected["url"])
        target = base + parsed_url.path + ("?" + parsed_url.query if parsed_url.query else "")
        status, html = fetch(target)
        if status != expected["status"]:
            failures.append(f"{parsed_url.path}: HTTP {status}, expected {expected['status']} (redirects fail)")
            continue
        actual = inspect(html)
        for key, value in actual.items():
            if value != expected[key]:
                failures.append(f"{parsed_url.path}: {key} changed: {value!r} != {expected[key]!r}")
        print(f"PASS {parsed_url.path} HTTP {status}")

    status, xml = fetch(base + "/sitemap.xml")
    if status != 200:
        failures.append(f"/sitemap.xml: HTTP {status}")
    else:
        try:
            root = ET.fromstring(xml)
            current_urls = {node.text for node in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
            missing = SITEMAP_URLS - current_urls
            if missing:
                failures.append(f"/sitemap.xml: {len(missing)} baseline URLs missing; first: {sorted(missing)[0]}")
            else:
                print(f"PASS /sitemap.xml {len(current_urls)} URLs; all {len(SITEMAP_URLS)} baseline URLs retained")
        except ET.ParseError as error:
            failures.append(f"/sitemap.xml: invalid XML: {error}")

    for path in ("/robots.txt", "/rss"):
        status, _ = fetch(base + path)
        if status != 200:
            failures.append(f"{path}: HTTP {status}")
        else:
            print(f"PASS {path} HTTP 200")

    if failures:
        print("\nSEO REGRESSION FAILED:", *failures, sep="\n- ", file=sys.stderr)
        return 1
    print("SEO regression passed")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/seo-regression.py http://127.0.0.1:3000")
    raise SystemExit(main(sys.argv[1].rstrip("/")))
