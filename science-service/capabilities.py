"""Transparent runtime capability reporting; importability does not prove scientific validation."""
from __future__ import annotations
from importlib.util import find_spec
from importlib.metadata import PackageNotFoundError, version

DEPENDENCIES = {
    'rdkit': 'rdkit',
    'biopython': 'biopython',
    'primer3': 'primer3-py',
    'vina': 'vina',
}


def capabilities() -> dict:
    """Report actual installed scientific engines without attempting heavy computation."""
    details: dict[str, dict] = {}
    for module, distribution in DEPENDENCIES.items():
        available = find_spec('Bio' if module == 'biopython' else module) is not None
        try:
            installed_version = version(distribution) if available else None
        except PackageNotFoundError:
            installed_version = None
        details[module] = {'installed': available, 'version': installed_version,
                           'runtime_verified': False}
    return {'service': 'HelixLab scientific compute', 'engines': details,
            'interpretation': 'Installed is not a scientific validation or workflow test.',
            'docking_note': 'Vina also requires prepared inputs and external compute resources.'}
