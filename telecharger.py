import json, urllib.request, time, os
UA = "CassAVeloSiteBuilder/1.0 (https://github.com/splintersteph/cass-velo)"
os.makedirs("photos", exist_ok=True)
for v in json.load(open("liste.json")):
    u = v["thumb"].replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/").split("?")[0].replace("/960px-", "/1280px-")
    f = f"photos/{v['n']:03d}.jpg"
    for essai in range(4):
        try:
            open(f, "wb").write(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=60).read()); break
        except Exception as e:
            print(v["n"], e); time.sleep(5 * (essai + 1))
    time.sleep(1)
