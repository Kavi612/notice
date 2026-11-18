import glob
import zipfile

for z in sorted(glob.glob("notice-portal-backend/dist/*.zip")):
    with zipfile.ZipFile(z, "r") as zf:
        print(f"=== File: {z} ===")
        namelist = zf.namelist()
        top_level = sorted(list(set([n.split("/")[0] for n in namelist])))
        print(f"Top-level entries: {top_level}")
        print("All entries:")
        for n in namelist:
            print(f"  {n}")
        if "index.mjs" in namelist:
            content = zf.read("index.mjs").decode("utf-8")
            lines = content.strip().split("\n")
            print("First lines of index.mjs:")
            for l in lines[:2]:
                print(f"  {l}")
        print()
