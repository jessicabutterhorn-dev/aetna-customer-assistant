"""
PDF extraction script for Aetna Missouri KB.

Reads every PDF from raw_dir, extracts text via pdfplumber,
writes to knowledge-base/raw-text/<category>/<stem>.txt,
and generates/updates knowledge-base/manifest.json.

Usage:
  .venv/Scripts/python scripts/extract-pdfs.py [--dry-run]
"""

import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("ERROR: pdfplumber not installed. Run: .venv/Scripts/pip install pdfplumber")

RAW_DIR = Path(r"C:\JessicaLLMWiki\Jessica-LLM-Wiki\raw")
KB_DIR = Path(__file__).parent.parent / "knowledge-base"
OUT_DIR = KB_DIR / "raw-text"
MANIFEST_PATH = KB_DIR / "manifest.json"
DRY_RUN = "--dry-run" in sys.argv


def classify(stem: str) -> tuple[str, list[str], str | None]:
    """
    Returns (category, plan_ids, plan_family).
    category: eoc | sob | anoc | formulary | extra-benefit | supplemental
    plan_ids: list of H-codes like ["H2663-021"] or ["all"]
    plan_family: HMO | HMO-POS | PPO | DSNP | CSNP | None
    """
    s = stem.lower()

    # EOC
    if s.startswith("evidence of coverage"):
        ids = extract_plan_ids(stem) or ["all"]
        return "eoc", ids, plan_family_from_id(ids[0] if ids else "")

    # SOB — note: "Summary of Benefits 2663_063.pdf" (missing H prefix)
    if s.startswith("summary of benefits"):
        ids = extract_plan_ids(stem)
        if not ids:
            # Fallback: bare number pattern like "2663_063"
            m = re.search(r"(\d{4})[-_](\d{3,4})", stem)
            if m:
                ids = [f"H{m.group(1)}-{m.group(2).zfill(3)}"]
        if not ids:
            ids = ["all"]
        return "sob", ids, plan_family_from_id(ids[0] if ids else "")

    # ANOC
    if s.startswith("annual notice of change"):
        ids = extract_plan_ids(stem) or ["all"]
        return "anoc", ids, None  # ANOCs can span multiple plan families

    # Formularies
    if "formulary" in s and "b2_2026" in s.replace(" ", "_").lower():
        if "hmo_pos" in s.replace(" ", "_").lower() or "hmo-pos" in s:
            return "formulary", ["all"], "HMO-POS"
        if "dsnp" in s or "d-snp" in s:
            return "formulary", ["all"], "DSNP"
        if "csnp" in s or "c-snp" in s:
            return "formulary", ["all"], "CSNP"
        if "ppo" in s:
            return "formulary", ["all"], "PPO"
        if "hmo" in s:
            return "formulary", ["all"], "HMO"
        return "formulary", ["all"], None

    # Extra benefit cards
    if any(x in s for x in ["extra_benefit", "extra benefit", "otc_catalog", "otc catalog", "wallet"]):
        if "csnp" in s:
            return "extra-benefit", ["all"], "CSNP"
        if "dsnp" in s or "d-snp" in s:
            return "extra-benefit", ["all"], "DSNP"
        if "hmo_pos" in s or "hmo-pos" in s:
            return "extra-benefit", ["all"], "HMO-POS"
        return "extra-benefit", ["all"], None

    if "otc_catalog" in s.replace(" ", "_").lower():
        return "extra-benefit", ["all"], None

    # Federal / supplemental
    if "medicare_and_you" in s.replace(" ", "_").lower() or "medicare and you" in s:
        return "supplemental", ["all"], None
    if "lis" in s or "low-income" in s or "low income" in s:
        return "supplemental", ["all"], None
    if "aetna_medicare_missouri" in s.replace(" ", "_").lower():
        return "supplemental", ["all"], None

    return "supplemental", ["all"], None


def extract_plan_ids(stem: str) -> list[str]:
    """Extract H-codes like H2663-021 from a filename stem. Returns [] if none found."""
    raw_ids = re.findall(r"H(\d{4})[-_](\d{3,4})", stem, re.IGNORECASE)
    return [f"H{c}-{p.zfill(3)}" for c, p in raw_ids]


def plan_family_from_id(plan_id: str) -> str | None:
    contract = plan_id.split("-")[0].upper() if "-" in plan_id else ""
    if contract == "H1608":
        return "PPO"
    if contract == "H2663":
        return "HMO"  # covers both HMO and HMO-POS
    if contract == "H5325":
        return "DSNP"
    return None


def extract_text(pdf_path: Path) -> str:
    with pdfplumber.open(pdf_path) as pdf:
        pages = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)


def safe_stem(stem: str) -> str:
    """Sanitize filename for output."""
    return re.sub(r'[<>:"/\\|?*]', "-", stem)


def keywords_for(category: str, plan_ids: list[str], plan_family: str | None) -> list[str]:
    kws = []
    # Add H-numbers as keywords
    for pid in plan_ids:
        if pid != "all":
            kws.append(pid.lower())
            kws.append(pid.lower().replace("-", "_"))
    # Category-specific keywords
    if category == "eoc":
        kws += ["evidence of coverage", "eoc", "coverage", "covered", "benefit"]
    elif category == "sob":
        kws += ["summary of benefits", "sob", "copay", "deductible", "premium", "cost"]
    elif category == "anoc":
        kws += ["annual notice", "anoc", "changed", "changes", "2025", "2026 change", "what changed"]
    elif category == "formulary":
        kws += ["drug", "medication", "prescription", "rx", "formulary", "tier", "part d"]
        if plan_family:
            kws.append(plan_family.lower())
    elif category == "extra-benefit":
        kws += ["otc", "wallet", "extra benefit", "flex card", "grocery", "food card", "utility"]
        if plan_family:
            kws.append(plan_family.lower())
    elif category == "supplemental":
        kws += ["lis", "low income", "extra help", "medicare and you", "annual enrollment", "aep"]
    return kws


def main():
    print(f"Source: {RAW_DIR}")
    print(f"Output: {OUT_DIR}")
    print(f"Dry run: {DRY_RUN}")
    print()

    if not RAW_DIR.exists():
        sys.exit(f"ERROR: raw dir not found: {RAW_DIR}")

    pdfs = sorted(RAW_DIR.glob("*.pdf"))
    print(f"Found {len(pdfs)} PDFs to process\n")

    # Load existing manifest or start fresh
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    else:
        manifest = {"files": []}

    # Keep existing non-raw-text entries
    existing_md_entries = [e for e in manifest.get("files", []) if not e["name"].startswith("raw-text/")]
    new_entries = list(existing_md_entries)

    ok_count = 0
    fail_count = 0
    empty_count = 0

    for pdf in pdfs:
        stem = pdf.stem
        category, plan_ids, plan_family = classify(stem)
        out_subdir = OUT_DIR / category
        out_file = out_subdir / (safe_stem(stem) + ".txt")
        rel_path = "raw-text/" + category + "/" + safe_stem(stem) + ".txt"

        if DRY_RUN:
            print(f"[DRY] {stem[:60]:<60} -> {category}/{safe_stem(stem)[:30]}.txt | ids={plan_ids} family={plan_family}")
            continue

        # Extract
        try:
            text = extract_text(pdf)
        except Exception as e:
            print(f"FAIL {stem}: {e}")
            fail_count += 1
            continue

        if not text.strip():
            print(f"EMPTY {stem} — no text extracted (may be image-only PDF)")
            empty_count += 1
            continue

        # Write
        out_subdir.mkdir(parents=True, exist_ok=True)
        out_file.write_text(text, encoding="utf-8")
        size_kb = len(text) // 1024
        print(f"OK  {stem[:55]:<55} -> {category}/{safe_stem(stem)[:25]}.txt ({size_kb}KB)")
        ok_count += 1

        # Manifest entry
        new_entries.append({
            "name": rel_path,
            "label": label_for(stem, category, plan_ids, plan_family),
            "type": category,
            "plan_ids": plan_ids,
            "plan_family": plan_family,
            "keywords": keywords_for(category, plan_ids, plan_family),
        })

    if not DRY_RUN:
        manifest["files"] = new_entries
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(f"\nExtracted: {ok_count} OK, {fail_count} FAILED, {empty_count} EMPTY")
        print(f"Manifest written: {MANIFEST_PATH} ({len(new_entries)} entries)")


def label_for(stem: str, category: str, plan_ids: list[str], plan_family: str | None) -> str:
    ids_str = "/".join(plan_ids) if plan_ids != ["all"] else (plan_family or "All Plans")
    type_labels = {"eoc": "Evidence of Coverage", "sob": "Summary of Benefits",
                   "anoc": "Annual Notice of Change", "formulary": "Formulary",
                   "extra-benefit": "Extra Benefits", "supplemental": "Reference"}
    return f"{type_labels.get(category, category)} — {ids_str}"


if __name__ == "__main__":
    main()
