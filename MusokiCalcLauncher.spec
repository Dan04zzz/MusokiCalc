# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['calculator_launcher.py'],
    pathex=[],
    binaries=[],
    datas=[('index.html', '.'), ('mastersheet.html', '.'), ('frags.html', '.'), ('js', 'js'), ('css', 'css'), ('calc', 'calc'), ('backups', 'backups'), ('img', 'img'), ('tools', 'tools')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='MusokiCalcLauncher',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
