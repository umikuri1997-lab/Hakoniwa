# Frostwood ships as one HTML file. The build that produces it is the same one
# `npm run build` runs locally — it happens here, in the image, so the deployed
# page is built from this tree's source rather than from whatever dist/ happened
# to be lying around (dist/ is gitignored and never enters the build context).
FROM node:22-alpine AS build
WORKDIR /app

# Playwright is a devDependency used by the golden-frame capture, not by the
# build. Its postinstall would pull ~150 MB of browsers that this image never
# runs, and would fail on alpine besides.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The web target, not the default one. Same entry and same shell as the file you
# can hand somebody on a thumb drive; it differs only in that the three music
# tracks sit beside the page instead of inside it, which is what takes first
# load from ~2.9 MB to ~590 KB. See the header of build.mjs for why that cannot
# be the default: BiomeMusic fetch()es its tracks, and fetch of a relative path
# from file:// is blocked by the opaque origin, so the inlined build is the only
# one that still works with no server at all.
RUN npm run build:web

# dist/web/ IS the site: the page, its two precompressed forms, and the audio.
# Nothing else in dist/ is shipped — the rest is review captures written by the
# test and tooling passes.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/web/ /usr/share/nginx/html/
EXPOSE 8080
