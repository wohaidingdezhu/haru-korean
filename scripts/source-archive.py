from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path.cwd()
include=['src','public','scripts','tests','upstream','package.json','package-lock.json','LICENSE','README.md','THIRD_PARTY_NOTICES.md']
with ZipFile(root/'dist/source.zip','w',ZIP_DEFLATED) as z:
    for name in include:
        p=root/name
        files=p.rglob('*') if p.is_dir() else [p]
        for f in files:
            if f.is_file() and '__pycache__' not in f.parts:
                z.write(f,'haru-korean/'+str(f.relative_to(root)))
