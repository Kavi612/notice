import glob
import zipfile

for z in glob.glob("notice-portal-backend/dist/*.zip"):
    with zipfile.ZipFile(z, "r") as zf:
        print(f"=== {z} ===")
        for info in zf.infolist():
            print(f"  {info.filename} ({info.file_size} bytes)")
        print()
