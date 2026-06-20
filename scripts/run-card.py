#!/usr/bin/env python3
"""
run-card.py — run the next unchecked step of a Jackdaw Build Board card.

The card's runbook is a list of to-do items, each followed by a fenced code block
with the command for that step. This reads the card from Notion, finds the FIRST
unchecked to-do, and runs the command(s) attached to it. You tick the box in Notion
once you're happy, then run this again to advance to the next step.

It shows each command and asks before running it, and once the step's commands all
succeed it ticks that box in Notion for you — so the next run picks up the next step.
When the last box gets ticked it offers to flip the card's Status to Done.
Pass -y to skip the confirm prompt, --dry-run to only print, and --no-check to leave
the box for you to tick manually.

ONE-TIME SETUP
  1. Create an internal integration at https://www.notion.so/my-integrations
     (or reuse one) and copy its "Internal Integration Secret". Give it the
     "Read content" AND "Update content" capabilities (needed to tick the box).
  2. Make sure that integration can see the Jackdaw page (Share -> add it).
  3. export NOTION_TOKEN=ntn_xxx        (put it in your shell rc)

USAGE
  scripts/run-card.py                       # first In Progress DAW/fix task (falls back to first in Next)
  scripts/run-card.py --ui                  # first In Progress UI-kit task (falls back to Next)
  scripts/run-card.py --fix                 # first In Progress fix card (falls back to Next)
  scripts/run-card.py --daw                 # first In Progress feature card (falls back to Next)
  scripts/run-card.py <card-name | notion-url | page-id>
  flags: [--dry-run] [-y] [--no-check] [-v] [--pick] [--ui | --fix | --daw]
         -v/--verbose: log each Notion request + timing to stderr.
         --pick: re-query the board (the picked card is cached ~10 min, per filter, so repeat runs skip it).
  e.g.
  scripts/run-card.py --ui                  # -> "Start working on \"fx-chip\"? [y/N]"
  scripts/run-card.py audio-import
  scripts/run-card.py https://www.notion.so/Jackdaw-...-3832605474e581dfae27d1b12a117f86
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"
REQUEST_TIMEOUT = 30  # seconds — fail fast with a clear message instead of hanging on a stalled connection
# Cache the auto-picked card so repeat runs skip the board query (the slow call). --pick forces a re-query.
CACHE_FILE = os.path.join(tempfile.gettempdir(), "jackdaw-runcard.json")
CACHE_TTL = 600  # seconds — re-pick from the board after this even if cached
# The Build Board database id (override with JACKDAW_BOARD_DB if it ever changes).
BOARD_DB = os.environ.get("JACKDAW_BOARD_DB", "d32b7aadfe5a4924bab6a440f21f442a")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Block types that end the current step while collecting its commands.
STEP_BOUNDARY = {"to_do", "heading_1", "heading_2", "heading_3"}

VERBOSE = False


def log(msg):
    """Verbose breadcrumb to stderr (so it never mixes with the interactive prompts)."""
    if VERBOSE:
        print(f"  · {msg}", file=sys.stderr, flush=True)


def _read_cache(label):
    try:
        with open(CACHE_FILE) as f:
            c = json.load(f)
        if c.get("label") == label and time.time() - c.get("ts", 0) < CACHE_TTL:
            return c["id"], c["name"]
    except (OSError, ValueError, KeyError):
        pass
    return None


def _write_cache(page_id, name, label):
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump({"id": page_id, "name": name, "label": label, "ts": time.time()}, f)
    except OSError:
        pass


def _clear_cache():
    try:
        os.remove(CACHE_FILE)
    except OSError:
        pass


# ---- Notion API ------------------------------------------------------------
def _token():
    tok = os.environ.get("NOTION_TOKEN")
    if not tok:
        sys.exit("NOTION_TOKEN is not set. See the setup notes at the top of this script.")
    return tok


def _req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + _token())
    req.add_header("Notion-Version", NOTION_VERSION)
    req.add_header("Content-Type", "application/json")
    log(f"{method} {path} … (timeout {REQUEST_TIMEOUT}s)")
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as r:
            status, payload = r.status, json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Notion API {e.code} on {method} {path}: {e.read().decode(errors='replace')}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        sys.exit(f"Couldn't reach the Notion API ({API}) after {REQUEST_TIMEOUT}s: {e}\n"
                 "Check your internet / VPN / proxy (open https://api.notion.com in a browser to confirm "
                 "reachability). Behind a proxy? export HTTPS_PROXY=http://host:port and retry.")
    log(f"{method} {path} → {status} in {int((time.monotonic() - t0) * 1000)} ms")
    return payload


def to_uuid(hex32):
    s = hex32.replace("-", "")
    return f"{s[0:8]}-{s[8:12]}-{s[12:16]}-{s[16:20]}-{s[20:32]}"


# Kind filters for the auto-pick, keyed by flag. Default = the app work (anything but the UI kit).
KIND_FILTERS = {
    "default": ({"property": "Kind", "select": {"does_not_equal": "kit"}}, "DAW/fix"),
    "ui":      ({"property": "Kind", "select": {"equals": "kit"}},  "UI-kit"),
    "fix":     ({"property": "Kind", "select": {"equals": "fix"}},  "fix"),
    "daw":     ({"property": "Kind", "select": {"equals": "feat"}}, "DAW"),
}


def _query_first(status, kind_filter):
    """First card in <status> matching the kind filter (oldest first), or None."""
    res = _req("POST", f"/databases/{BOARD_DB}/query", {
        "filter": {"and": [
            {"property": "Status", "select": {"equals": status}},
            kind_filter,
        ]},
        "sorts": [{"timestamp": "created_time", "direction": "ascending"}],
        "page_size": 1,
    })
    results = res.get("results", [])
    if not results:
        return None
    page = results[0]
    title = page.get("properties", {}).get("Name", {}).get("title", [])
    name = "".join(rt.get("plain_text", "") for rt in title) or "(untitled)"
    return page["id"], name


def auto_pick(kind_filter, label):
    """First In Progress card for this filter; fall back to the first in Next. Returns (page_id, name)."""
    log(f"finding the next {label} task (In Progress, else Next)…")
    hit = _query_first("In Progress", kind_filter)
    if hit:
        return hit
    hit = _query_first("Next", kind_filter)
    if hit:
        log(f"no In Progress {label} task — using the first in Next")
        return hit
    sys.exit(f"No In Progress or Next {label} task on the board — nothing to pick up.")


def resolve_page_id(arg):
    """Accept a notion URL, a raw page id, or a card Name (looked up on the board)."""
    m = re.search(r"([0-9a-fA-F]{32})", arg.replace("-", ""))
    if m:
        return to_uuid(m.group(1))
    # Treat as a card name -> query the board for a title match.
    res = _req("POST", f"/databases/{BOARD_DB}/query",
               {"filter": {"property": "Name", "title": {"equals": arg}}, "page_size": 1})
    results = res.get("results", [])
    if not results:
        sys.exit(f"No card named {arg!r} on the board (try the Notion URL instead).")
    return results[0]["id"]


def all_blocks(page_id):
    log("loading the card's steps…")
    blocks, cursor = [], None
    while True:
        q = f"?start_cursor={cursor}" if cursor else ""
        res = _req("GET", f"/blocks/{page_id}/children?page_size=100" + ("&" + q[1:] if q else ""))
        blocks.extend(res.get("results", []))
        if not res.get("has_more"):
            return blocks
        cursor = res.get("next_cursor")


# ---- parsing (pure; covered by --self-test) --------------------------------
def plain(block, kind):
    return "".join(rt.get("plain_text", "") for rt in block.get(kind, {}).get("rich_text", [])).strip()


def next_step(blocks):
    """Return (label, [commands], todo_block_id) for the first unchecked to-do,
    or None if every to-do is checked. `commands` is empty for a manual step."""
    for i, b in enumerate(blocks):
        if b.get("type") == "to_do" and not b["to_do"].get("checked", False):
            label = plain(b, "to_do")
            cmds = []
            for nb in blocks[i + 1:]:
                t = nb.get("type")
                if t in STEP_BOUNDARY:
                    break
                if t == "code":
                    text = plain(nb, "code")
                    if text:
                        cmds.append(text)
            return label, cmds, b["id"]
    return None


# ---- run -------------------------------------------------------------------
def run_step(label, cmds, todo_id, *, dry_run, assume_yes, do_check):
    """Run one step's commands. Returns True iff it ticked the box in Notion."""
    print(f"\n▶ Next step: {label}\n")
    if not cmds:
        print("Manual step (no command). Do it yourself, then tick the box / re-run.")
        return False
    if dry_run:
        for c in cmds:
            print("    " + c.replace("\n", "\n    "))
        print("\n(--dry-run: not executing)")
        return False
    for c in cmds:
        print("    " + c.replace("\n", "\n    "))
        if not assume_yes:
            try:
                ans = input("Run this command? [y/N] ").strip().lower()
            except EOFError:
                ans = ""
            if ans not in ("y", "yes"):
                print("Skipped — box left unchecked.")
                return False
        print(f"$ {c}")
        rc = subprocess.run(c, shell=True, cwd=ROOT).returncode
        if rc != 0:
            sys.exit(f"\nCommand exited {rc} — stopping (box left unchecked).")
    print("\n✓ Step finished.")
    if do_check:
        _req("PATCH", f"/blocks/{todo_id}", {"to_do": {"checked": True}})
        print("✓ Ticked the box in Notion.")
        return True
    print("(--no-check) Tick the box yourself, then run again for the next step.")
    return False


def page_name(page_id):
    p = _req("GET", f"/pages/{page_id}")
    title = p.get("properties", {}).get("Name", {}).get("title", [])
    return "".join(rt.get("plain_text", "") for rt in title) or "(untitled)"


def finish_card(page_id, name, assume_yes):
    """All steps checked — offer to flip the card's Status to Done."""
    print(f'\nEvery step on "{name}" is checked.')
    if not assume_yes:
        try:
            ans = input(f'Mark "{name}" as Done on the board? [Y/n] ').strip().lower()
        except EOFError:
            ans = ""
        if ans in ("n", "no"):
            print("Left as-is.")
            return
    _req("PATCH", f"/pages/{page_id}", {"properties": {"Status": {"select": {"name": "Done"}}}})
    _clear_cache()
    print(f'✓ "{name}" set to Done. 🎉')


def slug(name):
    """Card Name -> spec slug, e.g. 'Song Notes' -> 'song-notes'."""
    s = re.sub(r"[^\w\s-]", "", name.strip().lower())
    return re.sub(r"[\s_]+", "-", s).strip("-")


def print_next():
    """Print the slug of the next non-kit card in 'Next' (for `jackdaw next`).
    Slug -> stdout (for capture); the human-readable line -> stderr."""
    kind_filter, _ = KIND_FILTERS["ui"]  # Kind == kit (this is the UI-kit repo)
    res = _req("POST", f"/databases/{BOARD_DB}/query", {
        "filter": {"and": [
            {"property": "Status", "select": {"equals": "Next"}},
            kind_filter,
        ]},
        "sorts": [{"timestamp": "created_time", "direction": "ascending"}],
        "page_size": 1,
    })
    results = res.get("results", [])
    if not results:
        sys.exit("No kit card in 'Next' — nothing to launch.")
    props = results[0].get("properties", {})
    title = props.get("Name", {}).get("title", [])
    name = "".join(rt.get("plain_text", "") for rt in title) or "(untitled)"
    kind = ((props.get("Kind", {}) or {}).get("select") or {}).get("name", "?")
    print(f'Next kit card: "{name}"  (Kind={kind})  ->  slug: {slug(name)}', file=sys.stderr)
    print(slug(name))
    return 0


def fetch_comments(page_id):
    """All comments on a page, oldest first (list of plain-text strings)."""
    out, cursor = [], None
    while True:
        q = f"&start_cursor={cursor}" if cursor else ""
        res = _req("GET", f"/comments?block_id={page_id}&page_size=100" + q)
        for c in res.get("results", []):
            txt = "".join(rt.get("plain_text", "") for rt in c.get("rich_text", [])).strip()
            if txt:
                out.append(txt)
        if not res.get("has_more"):
            return out
        cursor = res.get("next_cursor")


def print_meta(card_arg):
    """Print '<kind> <role> <role> …' — the card's Kind (feat/fix) then its Roles. Drives the build."""
    page_id = resolve_page_id(card_arg)
    props = _req("GET", f"/pages/{page_id}").get("properties", {})
    kind = ((props.get("Kind", {}) or {}).get("select") or {}).get("name", "feat")
    kind = "fix" if kind == "fix" else "feat"
    roles = [r.get("name", "") for r in props.get("Roles", {}).get("multi_select", []) if r.get("name")]
    print(kind + ("" if not roles else " " + " ".join(roles)))
    return 0


def print_instructions(card_arg):
    """Print a card's comments as the agent spec (comment-only model). Errors if there are none."""
    page_id = resolve_page_id(card_arg)
    cs = fetch_comments(page_id)
    if not cs:
        sys.exit("Card has no comments to use as instructions — shape it (add a comment) first.")
    print("\n\n".join(cs))
    return 0


def main(argv):
    args = [a for a in argv if not a.startswith("-")]
    flags = {a for a in argv if a.startswith("-")}
    global VERBOSE
    VERBOSE = "-v" in flags or "--verbose" in flags
    if "--self-test" in flags:
        return self_test()
    if "--print-next" in flags:
        return print_next()
    if "--meta" in flags:
        if not args:
            sys.exit("usage: run-card.py --meta <card>")
        return print_meta(args[0])
    if "--instructions" in flags:
        if not args:
            sys.exit("usage: run-card.py --instructions <card>")
        return print_instructions(args[0])
    assume_yes = "-y" in flags or "--yes" in flags
    if len(args) > 1:
        sys.exit(__doc__)
    if args:
        page_id = resolve_page_id(args[0])
        name = page_name(page_id)
    else:
        if "--ui" in flags:
            kind = "ui"
        elif "--fix" in flags:
            kind = "fix"
        elif "--daw" in flags:
            kind = "daw"
        else:
            kind = "default"
        kind_filter, label = KIND_FILTERS[kind]
        cached = None if "--pick" in flags else _read_cache(label)
        if cached:
            page_id, name = cached
            log(f"using cached {label} card '{name}' (skipping board query; --pick to re-pick)")
        else:
            page_id, name = auto_pick(kind_filter, label)
            _write_cache(page_id, name, label)
        if not assume_yes:
            try:
                ans = input(f'Start working on "{name}"? [y/N] ').strip().lower()
            except EOFError:
                ans = ""
            if ans not in ("y", "yes"):
                print("Okay — nothing run.")
                return 0
        else:
            print(f'Working on "{name}".')

    dry_run = "--dry-run" in flags
    do_check = "--no-check" not in flags
    blocks = all_blocks(page_id)
    step = next_step(blocks)
    if step is None:
        if dry_run:
            print("All steps are checked — this card is done.")
        else:
            finish_card(page_id, name, assume_yes)
        return 0

    ticked = run_step(*step, dry_run=dry_run, assume_yes=assume_yes, do_check=do_check)
    if ticked:
        # reflect the tick locally; if that was the last box, offer to mark the card Done now.
        for b in blocks:
            if b.get("id") == step[2]:
                b["to_do"]["checked"] = True
        if next_step(blocks) is None:
            finish_card(page_id, name, assume_yes)
        else:
            print("Run again for the next step.")
    return 0


# ---- offline self-test (no network/token needed) ---------------------------
def self_test():
    def todo(text, checked, _id="x"):
        return {"type": "to_do", "id": _id, "to_do": {"checked": checked,
                "rich_text": [{"plain_text": text}]}}

    def code(text):
        return {"type": "code", "code": {"rich_text": [{"plain_text": text}]}}

    def h2(text):
        return {"type": "heading_2", "heading_2": {"rich_text": [{"plain_text": text}]}}

    blocks = [
        h2("Run (contract-first)"),
        todo("Worktrees clean", True),
        todo("Launch contract:", True),
        code("scripts/agent.sh --feature audio-import --kitty-fresh"),
        todo("Review + land contract:", False, "todo-land-contract"),
        code("scripts/feature.sh land audio-import contract"),
        todo("Re-run engine + UI:", False),
        code("scripts/agent.sh --feature audio-import --kitty-fresh"),
    ]
    label, cmds, tid = next_step(blocks)
    assert label == "Review + land contract:", label
    assert cmds == ["scripts/feature.sh land audio-import contract"], cmds
    assert tid == "todo-land-contract", tid

    # manual step first (no following code block)
    manual = [todo("Worktrees clean", False), todo("next", False), code("do-it")]
    label2, cmds2, _ = next_step(manual)
    assert label2 == "Worktrees clean" and cmds2 == [], (label2, cmds2)

    # all checked
    assert next_step([todo("a", True), code("x")]) is None

    # uuid normalisation + id extraction from a URL
    assert to_uuid("3832605474e581dfae27d1b12a117f86") == "38326054-74e5-81df-ae27-d1b12a117f86"
    print("self-test OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
