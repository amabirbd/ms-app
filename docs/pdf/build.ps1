param(
  [string]$Output = "build/b2b-platform-architecture.pdf"
)
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path (Split-Path $Output) | Out-Null
docker run --rm -v "${PWD}:/data" pandoc/extra `
  docs/architecture/platform.md `
  --from markdown+yaml_metadata_block `
  --toc --number-sections `
  --pdf-engine=xelatex `
  -V mainfont="DejaVu Sans" `
  -V colorlinks=true `
  -o $Output
