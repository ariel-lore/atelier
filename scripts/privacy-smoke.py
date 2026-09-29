#!/usr/bin/env python3
"""Smoke-check server-side audience filtering against a running dev server."""
import json
import urllib.request

BASE = "http://localhost:3000"


class Client:
    def __init__(self):
        self.cookie = ""

    def req(self, method, path, body=None, origin=True):
        data = None if body is None else json.dumps(body).encode()
        headers = {}
        if data is not None:
            headers["Content-Type"] = "application/json"
        if origin and method != "GET":
            headers["Origin"] = BASE
        if self.cookie:
            headers["Cookie"] = self.cookie
        request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request) as res:
                raw = res.read()
                set_cookie = res.headers.get("Set-Cookie")
                if set_cookie:
                    self.cookie = set_cookie.split(";", 1)[0]
                return res.status, raw
        except urllib.error.HTTPError as err:
            return err.code, err.read()

    def json(self, method, path, body=None):
        status, raw = self.req(method, path, body)
        text = raw.decode() if raw else ""
        return status, json.loads(text) if text else None


def is_image(raw: bytes) -> bool:
    return raw[:3] == b"\xff\xd8\xff" or raw[:8] == b"\x89PNG\r\n\x1a\n"


def captions(posts):
    return [(p["audience"], tuple(p["circleNames"]), p["caption"][:42]) for p in posts]


def main():
    anon = Client()
    status, profile = anon.json("GET", "/api/profile")
    assert status == 200, profile
    anon_posts = profile["profile"]["posts"]
    assert all(p["audience"] == "PUBLIC" for p in anon_posts), anon_posts
    assert len(anon_posts) >= 18
    blob = json.dumps(profile)
    for secret in ["Peaches", "kitchen table", "Draft notes", "soft lock"]:
        assert secret not in blob, secret

    status, body = anon.json("GET", "/api/profile/lists?handle=bart&kind=following")
    assert status == 403, body
    assert "alex" not in json.dumps(body)

    bart = Client()
    status, _ = bart.json("POST", "/api/auth/login", {"email": "bart@atelier.local", "password": "bart-atelier"})
    assert status == 200
    _, bart_feed = bart.json("GET", "/api/posts")
    by_caption = {p["caption"]: p for p in bart_feed["posts"]}
    family = next(p for p in bart_feed["posts"] if "Peaches" in p["caption"])
    close = next(p for p in bart_feed["posts"] if "Draft notes" in p["caption"])
    private = next(p for p in bart_feed["posts"] if "kitchen table" in p["caption"])
    public = next(p for p in bart_feed["posts"] if "Morning light" in p["caption"])
    assert len(bart_feed["posts"]) >= len(anon_posts) + 2

    _, stories = bart.json("GET", "/api/stories")
    story = {s["label"]: s for s in stories["stories"]}
    assert set(story) == {"Studio", "Walk", "Notes", "Coffee", "Coast", "Draft"}

    def expect(email, password, post_ids, story_ids):
        client = Client()
        status, _ = client.json("POST", "/api/auth/login", {"email": email, "password": password})
        assert status == 200, email
        _, feed = client.json("GET", "/api/posts")
        got = {p["id"] for p in feed["posts"]}
        assert got == set(post_ids), (email, captions(feed["posts"]))
        _, story_feed = client.json("GET", "/api/stories")
        got_stories = {s["id"] for s in story_feed["stories"]}
        assert got_stories == set(story_ids), (email, [(s["label"], s["audience"]) for s in story_feed["stories"]])
        # HTML profile must not contain forbidden captions
        status, html = client.req("GET", "/")
        assert status == 200
        text = html.decode()
        for post in bart_feed["posts"]:
            if post["id"] in got:
                continue
            assert post["caption"] not in text, (email, post["caption"][:40])
            assert post["mediaUrl"] not in text
        for pid, allowed in (
            (public["id"], True),
            (family["id"], family["id"] in got),
            (close["id"], close["id"] in got),
            (private["id"], private["id"] in got),
        ):
            code, raw = client.req("GET", f"/api/media/posts/{pid}")
            code_page, page = client.req("GET", f"/post/{pid}")
            code_api, _ = client.json("GET", f"/api/posts/{pid}")
            if allowed:
                assert code == 200 and is_image(raw), (email, pid, code, raw[:8])
                assert code_page == 200 and code_api == 200
            else:
                assert code == 404, (email, pid, code)
                assert code_page == 404, (email, "page", code_page)
                assert code_api == 404, (email, "api", code_api)
        return client

    public_ids = [p["id"] for p in bart_feed["posts"] if p["audience"] == "PUBLIC"]
    family_ids = public_ids + [family["id"]]
    close_ids = public_ids + [p["id"] for p in bart_feed["posts"] if "Close Friends" in p["circleNames"] or (p["audience"] == "CIRCLES" and "Family" not in p["circleNames"] and p["id"] != family["id"])]
    # close posts are those with Close Friends in circle names for bart
    close_only = [p["id"] for p in bart_feed["posts"] if "Close Friends" in p["circleNames"]]
    all_ids = [p["id"] for p in bart_feed["posts"]]

    public_stories = [s["id"] for s in stories["stories"] if s["audience"] == "PUBLIC"]
    family_stories = public_stories + [story["Coffee"]["id"]]
    close_stories = public_stories + [story["Notes"]["id"]]
    all_stories = [s["id"] for s in stories["stories"]]

    anon_client_posts = {p["id"] for p in anon_posts}
    assert anon_client_posts == set(public_ids)

    expect("alex@atelier.local", "member-atelier", family_ids, family_stories)
    expect("sam@atelier.local", "member-atelier", public_ids + close_only, close_stories)
    expect("jordan@atelier.local", "member-atelier", public_ids, public_stories)
    expect("bart@atelier.local", "bart-atelier", all_ids, all_stories)

    # story media gate
    alex = Client()
    alex.json("POST", "/api/auth/login", {"email": "alex@atelier.local", "password": "member-atelier"})
    code, _ = alex.req("GET", f"/api/media/stories/{story['Notes']['id']}")
    assert code == 404, code
    code, _ = alex.req("GET", f"/stories/{story['Notes']['id']}")
    assert code == 404, code
    code, raw = alex.req("GET", f"/api/media/stories/{story['Coffee']['id']}")
    assert code == 200 and is_image(raw), code
    for image in family["images"]:
        code, _ = alex.req("GET", image["mediaUrl"])
        assert code == 200, image["mediaUrl"]
        code, _ = Client().req("GET", image["mediaUrl"])
        assert code == 404, image["mediaUrl"]
    for image in close["images"]:
        code, _ = alex.req("GET", image["mediaUrl"])
        assert code == 404, image["mediaUrl"]

    # member cannot create a post or read circles
    code, body = alex.json("GET", "/api/circles")
    assert code == 403, body

    # jordan cannot DM
    jordan = Client()
    jordan.json("POST", "/api/auth/login", {"email": "jordan@atelier.local", "password": "member-atelier"})
    code, body = jordan.json("POST", "/api/messages", {"userId": "nope"})
    assert code == 403, body

    # alex can open a thread with bart
    _, me = alex.json("GET", "/api/auth/me")
    # find bart id via people search
    _, people = alex.json("GET", "/api/people?q=bart")
    bart_id = next(p["id"] for p in people["people"] if p["handle"] == "bart")
    code, body = alex.json("POST", "/api/messages", {"userId": bart_id})
    assert code == 200, body
    code, sent = alex.json("POST", f"/api/messages/{body['threadId']}", {"body": "Smoke test hello"})
    assert code == 200 and sent["message"]["body"] == "Smoke test hello"

    # wrong circle user must not see family caption in home HTML
    sam = Client()
    sam.json("POST", "/api/auth/login", {"email": "sam@atelier.local", "password": "member-atelier"})
    _, home = sam.req("GET", "/home")
    assert b"Peaches" not in home
    assert b"Morning light" in home
    assert b"Draft notes" in home

    print("privacy smoke checks passed")
    print("public", len(public_ids), "family-extra", 1, "close-extra", len(close_only))


if __name__ == "__main__":
    main()
