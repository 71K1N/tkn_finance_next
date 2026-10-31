#!/usr/bin/env bash
# Publishes the Next.js standalone build to the Raspberry Pi (pm2 app "web").
#
# Usage:
#   scripts/deploy-rasp.sh              # build, upload, swap, restart (asks before swapping)
#   scripts/deploy-rasp.sh --yes        # same, without the confirmation
#   scripts/deploy-rasp.sh --no-build   # reuse the existing .next build
#   scripts/deploy-rasp.sh --rollback   # swap deploy <-> deploy.old and restart
#
# Auth is an SSH key by default. One-time setup: ssh-copy-id root@192.168.1.6
# Without a key, RASP_PASSWORD_AUTH=1 scripts/deploy-rasp.sh --yes asks for the password instead.
# Overridable: RASP_HOST, RASP_USER, RASP_DIR, RASP_PM2_APP, RASP_PORT (app port), RASP_KEEP_BACKUPS.
set -euo pipefail

RASP_HOST="${RASP_HOST:-192.168.1.6}"
RASP_USER="${RASP_USER:-root}"
RASP_DIR="${RASP_DIR:-/www/web}"
RASP_PM2_APP="${RASP_PM2_APP:-web}"
RASP_PORT="${RASP_PORT:-3000}"
RASP_KEEP_BACKUPS="${RASP_KEEP_BACKUPS:-3}"
# pm2 lives under nvm on the Pi and is not on a non-interactive shell's PATH.
RASP_NODE_BIN="${RASP_NODE_BIN:-/root/.nvm/versions/node/v24.21.0/bin}"

TARGET="$RASP_USER@$RASP_HOST"
if [ "${RASP_PASSWORD_AUTH:-0}" = 1 ]; then
    # Password login: ssh prompts on the terminal, and one multiplexed connection is reused
    # by every ssh/scp below so the password is asked once (if the local ssh can't multiplex,
    # it simply asks again on each call).
    SSH_OPTS=(-o ConnectTimeout=8 -o ControlMaster=auto -o ControlPath=/tmp/rasp-cm-%C -o ControlPersist=10m)
    # Git Bash's ssh can't multiplex ("Failed to connect to new control master"): RASP_SSH_MUX=0 drops it.
    [ "${RASP_SSH_MUX:-1}" = 0 ] && SSH_OPTS=(-o ConnectTimeout=8)
else
    SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=8)
fi

YES=0; BUILD=1; ROLLBACK=0
for arg in "$@"; do
    case "$arg" in
        --yes|-y) YES=1 ;;
        --no-build) BUILD=0 ;;
        --rollback) ROLLBACK=1 ;;
        *) echo "Unknown option: $arg" >&2; exit 2 ;;
    esac
done

remote() { ssh "${SSH_OPTS[@]}" "$TARGET" "export PATH=\$PATH:$RASP_NODE_BIN; $1"; }

confirm() {
    [ "$YES" -eq 1 ] && return 0
    read -r -p "$1 [y/N] " answer
    [[ "$answer" =~ ^[yYsS]$ ]]
}

if ! ssh "${SSH_OPTS[@]}" "$TARGET" true; then
    echo "Cannot SSH to $TARGET. Key login: run once ssh-copy-id $TARGET. Password login: RASP_PASSWORD_AUTH=1 (and check the user/password)." >&2
    exit 1
fi

health_check() {
    # The app needs a moment after pm2 restarts it.
    remote "for i in 1 2 3 4 5 6 7 8; do
        code=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$RASP_PORT/ || true)
        [ \"\$code\" = 200 ] && { echo \"health: 200\"; exit 0; }
        sleep 2
    done
    echo \"health: failed (last code \$code)\"; exit 1"
}

if [ "$ROLLBACK" -eq 1 ]; then
    confirm "Roll back $RASP_DIR/deploy to deploy.old on $RASP_HOST?" || exit 1
    remote "set -e; cd $RASP_DIR
        [ -d deploy.old ] || { echo 'No deploy.old to roll back to'; exit 1; }
        rm -rf deploy.bad && mv deploy deploy.bad && mv deploy.old deploy && mv deploy.bad deploy.old
        pm2 restart $RASP_PM2_APP --update-env >/dev/null"
    health_check
    echo "Rolled back."
    exit 0
fi

# next build must run from the canonical-case path: on Windows, "financeApp" vs "FinanceApp"
# makes webpack load duplicate modules (two Reacts) and the prerender fails.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
if command -v cygpath >/dev/null 2>&1; then
    ROOT="$(cygpath -m "$ROOT")"
    ROOT="$(cd "$ROOT" && pwd -P)"
fi
cd "$ROOT"

if [ "$BUILD" -eq 1 ]; then
    echo "==> Building"
    rm -rf .next
    npm run build
fi
[ -f .next/standalone/server.js ] || { echo "Missing .next/standalone — run without --no-build" >&2; exit 1; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/.next"
cp -r .next/standalone/. "$STAGE/"
cp -r .next/static "$STAGE/.next/static"
[ -d public ] && cp -r public "$STAGE/public"
[ -f .env.production ] && cp .env.production "$STAGE/.env.production"

echo "==> Packing"
# --force-local: GNU tar on Windows reads "C:" in a path as a remote host.
tar --force-local -czf "$STAGE.tgz" -C "$STAGE" .
trap 'rm -rf "$STAGE" "$STAGE.tgz"' EXIT

confirm "Deploy to $TARGET:$RASP_DIR/deploy and restart '$RASP_PM2_APP'?" || exit 1

echo "==> Uploading"
scp "${SSH_OPTS[@]}" "$STAGE.tgz" "$TARGET:/tmp/web-deploy.tgz"

echo "==> Swapping and restarting"
remote "set -e; cd $RASP_DIR
    tar -czf deploy-backup-\$(date +%Y%m%d%H%M).tgz deploy
    rm -rf deploy.new && mkdir deploy.new && tar -xzf /tmp/web-deploy.tgz -C deploy.new
    rm -rf deploy.old && mv deploy deploy.old && mv deploy.new deploy
    rm -f /tmp/web-deploy.tgz
    ls -1t deploy-backup-*.tgz | tail -n +$((RASP_KEEP_BACKUPS + 1)) | xargs -r rm -f
    pm2 restart $RASP_PM2_APP --update-env >/dev/null"

if ! health_check; then
    echo "Health check failed. Previous version is in $RASP_DIR/deploy.old; run: scripts/deploy-rasp.sh --rollback" >&2
    exit 1
fi
echo "Deployed to http://$RASP_HOST/"
