"""Regression checks for rejected inputs before optional compute engines load."""
import math
import pytest
from docking_engine import dock_prepared
from advanced_api import DockingInput

MINIMAL = 'ATOM      1  C   LIG A   1       0.000   0.000   0.000  1.00  0.00           C\n'

@pytest.mark.parametrize('center', [
    [math.nan, 0, 0], [math.inf, 0, 0], [-math.inf, 0, 0], [2001, 0, 0],
])
def test_nonfinite_or_extreme_box_center_is_rejected(center):
    with pytest.raises(ValueError, match='Invalid docking coordinates'):
        dock_prepared(MINIMAL, MINIMAL, center, [20, 20, 20])

@pytest.mark.parametrize('size', [
    [math.nan, 20, 20], [math.inf, 20, 20], [4, 20, 20], [33, 20, 20],
])
def test_nonfinite_or_invalid_box_dimensions_are_rejected(size):
    with pytest.raises(ValueError, match='box dimension'):
        dock_prepared(MINIMAL, MINIMAL, [0, 0, 0], size)


def test_invalid_pdbqt_rejected_without_invoking_vina():
    with pytest.raises(ValueError, match='prepared PDBQT'):
        dock_prepared('NOT A PDBQT', MINIMAL, [0, 0, 0], [20, 20, 20])


def test_pydantic_input_shape_and_exhaustiveness_are_constrained():
    with pytest.raises(Exception):
        DockingInput(receptor_pdbqt=MINIMAL, ligand_pdbqt=MINIMAL,
                     center=[0, 0], box_size=[20, 20, 20])
    with pytest.raises(Exception):
        DockingInput(receptor_pdbqt=MINIMAL, ligand_pdbqt=MINIMAL,
                     center=[0, 0, 0], box_size=[20, 20, 20], exhaustiveness=100)
