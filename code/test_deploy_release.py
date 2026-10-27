"""Exercise deployment against a temporary filesystem and mocked services.

Run: python code/test_deploy_release.py (requires Bash).
"""
import io
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import unittest


def shell_path(path):
    value = Path(path).resolve().as_posix()
    if os.name == "nt":
        return "/" + value[0].lower() + value[2:]
    return value


class DeploymentTests(unittest.TestCase):
    def deploy(self, scenario="success", download=False):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            site = root / "pldb"
            site.mkdir()
            (site / "index.html").write_text("old")
            (root / "pldb-repo.conf").write_text("https://example.invalid/pldb")
            artifact = root / "artifact.tar.gz"
            with tarfile.open(artifact, "w:gz") as archive:
                files = {"index.html": b"new", "package.json": b"{}"}
                if scenario == "invalid":
                    del files["index.html"]
                for name, data in files.items():
                    info = tarfile.TarInfo(name)
                    info.size = len(data)
                    archive.addfile(info, io.BytesIO(data))
            script = root / "deploy.sh"
            source = Path(__file__).with_name("deploy-release.sh").read_text()
            script.write_text(source.replace("/root", shell_path(root)), newline="\n")
            mocks = root / "bin"
            mocks.mkdir()
            commands = {
                "flock": 'exit 0',
                "sleep": 'exit 0',
                "npm": '[ "$SCENARIO" != dependencies ]',
                "systemctl": '''if [ "$SCENARIO" = restart ] && [ "$1" = restart ] &&
    [ "$(cat "$TEST_ROOT/pldb/index.html")" = new ]; then exit 1; fi
exit 0''',
                "curl": '''if [ "$1" = --fail ] && [ "$2" = --show-error ]; then
    [ "$SCENARIO" != download ] || exit 1
    for last; do :; done
    cp "$ARTIFACT" "$last"
else
    # Reject a health check routed through Nginx's HTTP redirect.
    case " $* " in
        *" http://127.0.0.1:3000/ "*) ;;
        *) exit 1 ;;
    esac
    [ "$SCENARIO" != health ]
fi''',
            }
            for name, body in commands.items():
                target = mocks / name
                target.write_text("#!/bin/bash\n" + body + "\n", newline="\n")
                target.chmod(0o755)
            bash = os.environ.get("TEST_BASH") or shutil.which("bash")
            if os.name == "nt" and Path("C:/Program Files/Git/bin/bash.exe").exists():
                bash = "C:/Program Files/Git/bin/bash.exe"
            self.assertIsNotNone(bash, "Bash is required")
            env = dict(os.environ, SCENARIO=scenario, TEST_ROOT=shell_path(root),
                       ARTIFACT=shell_path(artifact))
            # Prepend mocks inside Bash, whose PATH uses POSIX separators.
            command = 'export PATH="$1:$PATH"; shift; exec bash "$@"'
            args = [bash, "-c", command, "test", shell_path(mocks), shell_path(script)]
            if not download:
                args.append(shell_path(artifact))
            result = subprocess.run(args, env=env, capture_output=True, text=True, timeout=20)
            expected_success = scenario == "success"
            self.assertEqual(result.returncode == 0, expected_success, result.stdout + result.stderr)
            self.assertEqual((site / "index.html").read_text(), "new" if expected_success else "old")
            self.assertEqual(list(root.glob("pldb-staging.*")), [])

    def test_success(self):
        self.deploy()

    def test_weekly_download(self):
        self.deploy(download=True)

    def test_failed_download_keeps_site(self):
        self.deploy("download", download=True)

    def test_invalid_artifact_keeps_site(self):
        self.deploy("invalid")

    def test_dependency_failure_keeps_site(self):
        self.deploy("dependencies")

    def test_restart_failure_rolls_back(self):
        self.deploy("restart")

    def test_health_failure_rolls_back(self):
        self.deploy("health")


if __name__ == "__main__":
    unittest.main()
