"""Runtime transparency and authentication regression tests."""
from fastapi.testclient import TestClient
from capabilities import capabilities
from main import app


def test_capabilities_do_not_invent_installed_scientific_engines():
    result = capabilities()
    for engine in ('rdkit', 'biopython', 'primer3', 'vina'):
        assert isinstance(result['engines'][engine]['installed'], bool)
        assert result['engines'][engine]['runtime_verified'] is False
        if not result['engines'][engine]['installed']:
            assert result['engines'][engine]['version'] is None


def test_capability_endpoint_requires_real_server_auth(monkeypatch):
    monkeypatch.setenv('SCIENCE_SERVICE_SECRET', 'a_long_locally_generated_random_secret')
    client = TestClient(app)
    assert client.get('/v1/capabilities').status_code == 401
    response = client.get('/v1/capabilities',
                          headers={'X-Helix-Token': 'a_long_locally_generated_random_secret'})
    assert response.status_code == 200
    assert 'rdkit' in response.json()['engines']
