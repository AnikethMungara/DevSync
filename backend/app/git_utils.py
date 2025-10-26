from pygit2 import Repository, init_repository, Signature, GIT_SORT_TIME
import os, time

def _repo(path: str) -> Repository:
    repo_path = os.path.join(path, ".git")
    return Repository(repo_path)

def ensure_repo(workdir: str):
    git_dir = os.path.join(workdir, ".git")
    files_dir = os.path.join(workdir, "files")
    os.makedirs(files_dir, exist_ok=True)
    if not os.path.exists(git_dir):
        init_repository(workdir, False)
        # initial commit
        repo = _repo(workdir)
        repo.index.add_all()
        repo.index.write()
        author = committer = Signature("DevSync", "devsync@example.com")
        tree = repo.index.write_tree()
        repo.create_commit("HEAD", author, committer, "Initial commit", tree, [])

def commit_all(workdir: str, message: str) -> str:
    repo = _repo(workdir)
    repo.index.add_all()
    repo.index.write()
    if not repo.index.diff_to_tree(repo.head.peel().tree):
        return repo.head.target.hex  # no changes
    author = committer = Signature("DevSync", "devsync@example.com")
    tree = repo.index.write_tree()
    commit = repo.create_commit("HEAD", author, committer, message, tree, [repo.head.target])
    return commit.hex

def latest_diff(workdir: str) -> str:
    repo = _repo(workdir)
    head = repo.head.peel()
    if not head.parents:
        return ""
    diff = repo.diff(head.parents[0], head, cached=False)
    return diff.patch
