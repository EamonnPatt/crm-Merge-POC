import os
import uuid
from pathlib import Path

import pandas as pd
from flask import (
    Flask, render_template, request, redirect, url_for,
    session, send_file, flash, abort
)

BASE_DIR = Path(__file__).resolve().parent
SESSIONS_DIR = BASE_DIR / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_PREVIEW_ROWS = 200

app = Flask(__name__)
app.secret_key = os.environ.get("CRM_MERGE_SECRET", "dev-secret-change-me")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB upload cap


def session_dir(sid: str) -> Path:
    return SESSIONS_DIR / sid


def read_table(file_storage) -> pd.DataFrame:
    filename = file_storage.filename or ""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext or '(none)'}")
    if ext == ".csv":
        df = pd.read_csv(file_storage, dtype=str, keep_default_na=False, na_values=[""])
    else:
        df = pd.read_excel(file_storage, dtype=str)
        df = df.where(df.notna(), None)
    df.columns = [str(c).strip() for c in df.columns]
    return df


def normalize_key(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip().str.lower().replace({"none": "", "nan": ""})


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    crm_a_file = request.files.get("crm_a_file")
    crm_b_file = request.files.get("crm_b_file")
    crm_a_name = (request.form.get("crm_a_name") or "CRM A").strip() or "CRM A"
    crm_b_name = (request.form.get("crm_b_name") or "CRM B").strip() or "CRM B"

    if not crm_a_file or not crm_a_file.filename:
        flash("Please choose a file for the first CRM report.")
        return redirect(url_for("index"))
    if not crm_b_file or not crm_b_file.filename:
        flash("Please choose a file for the second CRM report.")
        return redirect(url_for("index"))

    try:
        df_a = read_table(crm_a_file)
        df_b = read_table(crm_b_file)
    except Exception as exc:
        flash(f"Could not read one of the files: {exc}")
        return redirect(url_for("index"))

    if df_a.empty or df_b.empty:
        flash("One of the uploaded files has no rows.")
        return redirect(url_for("index"))

    sid = uuid.uuid4().hex
    sdir = session_dir(sid)
    sdir.mkdir(parents=True, exist_ok=True)
    df_a.to_pickle(sdir / "df_a.pkl")
    df_b.to_pickle(sdir / "df_b.pkl")

    session.clear()
    session["sid"] = sid
    session["crm_a_name"] = crm_a_name
    session["crm_b_name"] = crm_b_name

    columns_a = list(df_a.columns)
    columns_b = list(df_b.columns)

    return render_template(
        "mapping.html",
        crm_a_name=crm_a_name,
        crm_b_name=crm_b_name,
        columns_a=columns_a,
        columns_b=columns_b,
        guess_a=guess_key(columns_a),
        guess_b=guess_key(columns_b),
        preview_a=df_a.head(5).to_dict(orient="records"),
        preview_b=df_b.head(5).to_dict(orient="records"),
    )


def guess_key(columns):
    for c in columns:
        if "email" in c.lower():
            return c
    return columns[0] if columns else None


@app.route("/merge", methods=["POST"])
def merge():
    sid = session.get("sid")
    if not sid:
        flash("Your session expired, please upload the files again.")
        return redirect(url_for("index"))

    sdir = session_dir(sid)
    try:
        df_a = pd.read_pickle(sdir / "df_a.pkl")
        df_b = pd.read_pickle(sdir / "df_b.pkl")
    except FileNotFoundError:
        flash("Your session expired, please upload the files again.")
        return redirect(url_for("index"))

    key_a = request.form.get("key_a")
    key_b = request.form.get("key_b")
    crm_a_name = session.get("crm_a_name", "CRM A")
    crm_b_name = session.get("crm_b_name", "CRM B")

    if key_a not in df_a.columns or key_b not in df_b.columns:
        flash("Please select a valid matching column for each file.")
        return redirect(url_for("index"))

    df_a = df_a.copy()
    df_b = df_b.copy()
    df_a["_merge_key"] = normalize_key(df_a[key_a])
    df_b["_merge_key"] = normalize_key(df_b[key_b])

    suffix_a = f" ({crm_a_name})"
    suffix_b = f" ({crm_b_name})"

    merged = pd.merge(
        df_a, df_b,
        on="_merge_key",
        how="outer",
        suffixes=(suffix_a, suffix_b),
        indicator=True,
    )

    status_map = {
        "both": f"Matched in both",
        "left_only": f"Only in {crm_a_name}",
        "right_only": f"Only in {crm_b_name}",
    }
    merged["Match Status"] = merged["_merge"].astype(str).map(status_map)
    merged = merged.drop(columns=["_merge"])

    # Rows with an empty key never really "match" even if both sides had blank keys.
    blank_key_both = (merged["_merge_key"] == "") & (merged["Match Status"] == "Matched in both")
    merged.loc[blank_key_both, "Match Status"] = "Unmatched (blank key)"

    orig_cols_a = [c for c in df_a.columns if c != "_merge_key"]
    orig_cols_b = [c for c in df_b.columns if c != "_merge_key"]
    common_base = sorted(set(orig_cols_a) & set(orig_cols_b))

    conflict_pairs = []
    for base in common_base:
        col_a = f"{base}{suffix_a}"
        col_b = f"{base}{suffix_b}"
        if col_a in merged.columns and col_b in merged.columns:
            conflict_pairs.append((base, col_a, col_b))

    def clean(value):
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return ""
        return str(value).strip()

    def row_conflicts(row):
        names = []
        for base, col_a, col_b in conflict_pairs:
            va = clean(row.get(col_a))
            vb = clean(row.get(col_b))
            if va and vb and va != vb:
                names.append(base)
        return ", ".join(names)

    if conflict_pairs:
        merged["Conflicts"] = merged.apply(row_conflicts, axis=1)
    else:
        merged["Conflicts"] = ""

    display_cols = ["Match Status", "Conflicts"]
    for base, col_a, col_b in conflict_pairs:
        display_cols.extend([col_a, col_b])
    only_a = [c for c in orig_cols_a if c not in common_base]
    only_b = [c for c in orig_cols_b if c not in common_base]
    display_cols.extend([c for c in only_a if c not in display_cols])
    display_cols.extend([c for c in only_b if c not in display_cols])
    display_cols = [c for c in display_cols if c in merged.columns]

    final = merged[display_cols].copy()
    final = final.sort_values(by="Match Status")

    out_path = sdir / "merged.csv"
    final.to_csv(out_path, index=False)

    total = len(final)
    matched_both = int((final["Match Status"] == "Matched in both").sum())
    only_a_count = int((final["Match Status"] == f"Only in {crm_a_name}").sum())
    only_b_count = int((final["Match Status"] == f"Only in {crm_b_name}").sum())
    with_conflicts = int((final["Conflicts"] != "").sum())

    col_to_base = {col: base for base, col_a, col_b in conflict_pairs for col in (col_a, col_b)}
    preview_rows = final.head(MAX_PREVIEW_ROWS).fillna("").to_dict(orient="records")

    return render_template(
        "results.html",
        columns=display_cols,
        rows=preview_rows,
        col_to_base=col_to_base,
        total=total,
        matched_both=matched_both,
        only_a_count=only_a_count,
        only_b_count=only_b_count,
        with_conflicts=with_conflicts,
        crm_a_name=crm_a_name,
        crm_b_name=crm_b_name,
        truncated=total > MAX_PREVIEW_ROWS,
        preview_shown=min(total, MAX_PREVIEW_ROWS),
        sid=sid,
    )


@app.route("/download/<sid>")
def download(sid):
    if sid != session.get("sid"):
        abort(403)
    path = session_dir(sid) / "merged.csv"
    if not path.exists():
        abort(404)
    return send_file(path, as_attachment=True, download_name="merged_crm_data.csv")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
