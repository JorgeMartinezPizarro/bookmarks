## ABOUT

A proof of concept for a private Nextcloud extension: a system monitor that reads
a set of JSON log files and renders CPU/RAM/disk usage, running Docker containers,
and SSH login/attack activity.

It provides:

- a Nextcloud custom app (`nextcloud/custom_apps/custom_monitor`) that embeds the monitor
- a Next.js UI at `/pages/monitor` reading JSON files from `/var/www/html`

The log files themselves (`system.json`, `docker.json`, `access.json`) are produced by a
separate, private tool that is **not included** in this repo. This project only
demonstrates how to consume and render them.

`/pages/example`, `/api/get` and `/api/post` are kept as minimal scaffolding for new
API routes/pages, not part of the monitor itself.

This is a [next.js](https://nextjs.org/) project created with [create-next-app](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

Created and tested using `node@22.12`, `npm@11.2.0` and `docker@26.0.1`.

## SETUP

Copy `.env.local` to `.env` and write your actual values.

## RUN

Select your preferred method:

#### NPM

Run the UI using node:

```bash
git clone git@github.com:JorgeMartinezPizarro/bookmarks.git
copy .env bookmarks/.env
cd bookmarks
npm install
npm run start
```

#### DOCKER

```bash
git clone git@github.com:JorgeMartinezPizarro/bookmarks.git
copy .env bookmarks/.env
cd bookmarks
docker compose up -d
```

Navigate to [http://localhost:3000](http://localhost:3000) to start using the app.

## BUILD

```bash
docker build -t jorgemartinezpizarro/bookmarks:latest .
docker push jorgemartinezpizarro/bookmarks:latest
```

Change `jorgemartinezpizarro/bookmarks` to your own Docker Hub namespace.

## NOTE

It is required to link the app with a valid Nextcloud URL, otherwise the app will not work.
