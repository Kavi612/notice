import os
import zipfile

FUNCTIONS = ["createNotice", "listNotices", "getNotice", "updateNotice", "deleteNotice"]
BASE_DIR = os.path.abspath("notice-portal-backend")
DIST_DIR = os.path.join(BASE_DIR, "dist")
SRC_DIR = os.path.join(BASE_DIR, "src")

os.makedirs(DIST_DIR, exist_ok=True)

for fn in FUNCTIONS:
    zip_path = os.path.join(DIST_DIR, f"{fn}.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # 1. index.mjs
        index_code = f"export {{ handler }} from './src/handlers/{fn}.mjs';\n"
        zf.writestr("index.mjs", index_code)

        # 2. package.json
        pkg_code = f'{{"name": "{fn}", "type": "module"}}\n'
        zf.writestr("package.json", pkg_code)

        # 3. src/handlers/<fn>.mjs
        handler_path = os.path.join(SRC_DIR, "handlers", f"{fn}.mjs")
        with open(handler_path, "r", encoding="utf-8") as f:
            zf.writestr(f"src/handlers/{fn}.mjs", f.read())

        # 4. src/shared/auth.mjs
        auth_path = os.path.join(SRC_DIR, "shared", "auth.mjs")
        with open(auth_path, "r", encoding="utf-8") as f:
            zf.writestr("src/shared/auth.mjs", f.read())

        # 5. src/shared/noticeHelper.mjs
        helper_path = os.path.join(SRC_DIR, "shared", "noticeHelper.mjs")
        with open(helper_path, "r", encoding="utf-8") as f:
            zf.writestr("src/shared/noticeHelper.mjs", f.read())

    print(f"Created {zip_path}")
