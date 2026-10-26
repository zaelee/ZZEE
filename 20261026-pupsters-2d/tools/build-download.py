"""Rebuild the portable download and verify its contents."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
downloads = root / 'downloads'
downloads.mkdir(exist_ok=True)
archive = downloads / 'pupsters-2d-20261026.zip'
files = sorted(p for p in root.rglob('*') if p.is_file()
               and 'downloads' not in p.relative_to(root).parts
               and '__pycache__' not in p.relative_to(root).parts)
manifest = json.loads((root / 'docs/asset-manifest.json').read_text(encoding='utf-8'))
for asset in manifest['assets']:
    digest = hashlib.sha256((root / asset['file']).read_bytes()).hexdigest()
    if digest != asset['sha256']:
        raise ValueError('Run node tools/package.mjs first: ' + asset['file'])
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as package:
    for file in files:
        package.write(file, root.name + '/' + file.relative_to(root).as_posix())
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    assert len(package.namelist()) == len(files)
    assert root.name + '/index.html' in package.namelist()
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(downloads / 'SHA256SUMS.txt').write_text(digest + '  ' + archive.name + '\n', encoding='utf-8')
print(f'ZIP verified: {len(files)} files; {archive.stat().st_size:,} bytes; {len(manifest["assets"])} matching asset hashes.')
