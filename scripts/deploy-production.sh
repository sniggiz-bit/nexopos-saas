#!/bin/sh
set -eu
umask 077

fail() { printf '%s\n' "ERROR: $*" >&2; exit 1; }
[ "$#" -ge 1 ] || fail "Falta el SHA de la versión a desplegar."
release=$1
previous=unknown
if [ "$#" -ge 2 ]; then previous=$2; fi
case "$release" in ''|*[!0-9a-f]*) fail "SHA inválido." ;; esac
[ "$(printf %s "$release" | wc -c)" -eq 40 ] || fail "SHA inválido."
app_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$app_root"
[ "$(git rev-parse HEAD)" = "$release" ] || fail "El código no corresponde al SHA solicitado."
git diff --quiet && git diff --cached --quiet || fail "Hay cambios locales versionados en el servidor."

for container in nexopos_api nexopos_web nexopos_postgres; do
  [ "$(docker inspect --format '{{.State.Running}}' "$container")" = true ] || fail "$container no está en ejecución."
done
project=$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' nexopos_api)
case "$project" in ''|'<no value>'|*[!a-zA-Z0-9_-]*) fail "No se pudo identificar el proyecto Compose existente." ;; esac
base="$app_root/docker-compose.prod.yml"
current_ports=$(docker inspect --format '{{json .NetworkSettings.Ports}}' nexopos_web)
# Comparar sin imprimir secretos. Se conserva la conexión a la base y la configuración de acceso.
docker compose --project-name "$project" -f "$base" config --format json | docker exec -i -e NEXOPOS_CURRENT_PORTS="$current_ports" nexopos_api node -e '
let input=""; process.stdin.on("data", chunk => input += chunk); process.stdin.on("end", () => {
  const config=JSON.parse(input);
  const env=config.services.api.environment || {};
  const critical=["DATABASE_URL","JWT_SECRET","RESEND_API_KEY","FROM_EMAIL","FRONTEND_URL"];
  const changed=critical.filter(key => String(env[key] || "") !== String(process.env[key] || ""));
  if (changed.length) { console.error("La configuración actual difiere de Compose en: " + changed.join(", ")); process.exit(1); }
  const actual=JSON.parse(process.env.NEXOPOS_CURRENT_PORTS || "{}");
  const current=Object.entries(actual).flatMap(([port,bindings]) => (bindings || []).map(b => b.HostIp+":"+b.HostPort+"->"+port)).sort();
  const expected=(config.services.web.ports || []).map(p => (p.host_ip || "0.0.0.0")+":"+p.published+"->"+p.target+"/"+(p.protocol || "tcp")).sort();
  if (JSON.stringify(current)!==JSON.stringify(expected)) { console.error("Los puertos web actuales difieren de Compose. Se detiene antes de sustituir contenedores."); process.exit(1); }
  console.log("Preflight correcto: configuración crítica y puertos conservados.");
});'

stamp=$(date -u +%Y%m%dT%H%M%SZ)
short=$(printf '%.12s' "$release")
backup="$(dirname "$app_root")/deploy-backups/$stamp-$short"
mkdir -p "$backup"
release_file="$backup/release.yml"
rollback_file="$backup/rollback.yml"
api_before=$(docker inspect --format '{{.Image}}' nexopos_api)
web_before=$(docker inspect --format '{{.Image}}' nexopos_web)
docker image tag "$api_before" "nexopos-rollback-api:$stamp"
docker image tag "$web_before" "nexopos-rollback-web:$stamp"
printf 'services:\n  api:\n    image: nexopos-api:%s\n  web:\n    image: nexopos-web:%s\n' "$release" "$release" > "$release_file"
printf 'services:\n  api:\n    image: nexopos-rollback-api:%s\n  web:\n    image: nexopos-rollback-web:%s\n' "$stamp" "$stamp" > "$rollback_file"
printf 'previous_source=%s\nrelease=%s\napi_before=%s\nweb_before=%s\n' "$previous" "$release" "$api_before" "$web_before" > "$backup/metadata"
compose() { docker compose --project-name "$project" -f "$base" -f "$release_file" "$@"; }
rollback_needed=0
finish() {
  status=$1
  if [ "$status" -ne 0 ] && [ "$rollback_needed" -eq 1 ]; then
    printf '%s\n' "La actualización falló. Restaurando las imágenes anteriores."
    docker compose --project-name "$project" -f "$base" -f "$rollback_file" up -d --no-deps --no-build api web || printf '%s\n' "ERROR: revisar restauración manual con $rollback_file" >&2
  fi
  trap - EXIT
  exit "$status"
}
trap 'finish $?' EXIT

printf '%s\n' "Construyendo API con producción aún activa."
compose build api
printf '%s\n' "Construyendo frontend con producción aún activa."
compose build web
printf '%s\n' "Guardando respaldo privado de la base de datos."
docker exec nexopos_postgres sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup/database.dump"
[ -s "$backup/database.dump" ] || fail "El respaldo de la base quedó vacío."

rollback_needed=1
printf '%s\n' "Actualizando API."
compose up -d --no-deps --no-build api
attempt=0
until docker exec nexopos_api node -e 'fetch("http://127.0.0.1:3000/api",{signal:AbortSignal.timeout(2000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 60 ] || fail "La API no pasó la comprobación de salud."
  sleep 2
done
printf '%s\n' "Actualizando frontend."
compose up -d --no-deps --no-build web
attempt=0
until docker exec nexopos_web wget -q -O /dev/null http://127.0.0.1/api; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 30 ] || fail "El proxy web no pudo acceder a la API."
  sleep 2
done
printf '%s\n' "Verificando portada pública a través del proxy de cPanel."
attempt=0
until [ "$(curl -4 --max-time 10 -sS -o /dev/null -w '%{http_code}' https://nexopos.cl/ || true)" = 200 ]; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 12 ] || fail "La portada pública no respondió 200 después de actualizar el frontend."
  sleep 2
done
rollback_needed=0
printf 'DEPLOYED_SHA=%s\nBACKUP_DIR=%s\n' "$release" "$backup"
docker inspect --format '{{.Name}} {{.Image}} {{.State.Status}}' nexopos_api nexopos_web
