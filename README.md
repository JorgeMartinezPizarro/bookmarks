## ABOUT

A private extension for Nextcloud.

It provides:

- customizable views combining nextjs and nextcloud
- view to Train using your own GPT (Work in progress)
- view to manage Lightning Network (Work in progress)
- custom games using CSS HTML and Javascript (compatible with android mac linux windows ...) (Work in progress)
- custom report overview (Work in progress)

This is a [next.js](https://nextjs.org/) project created with [create-next-app](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

It requires `node@18.17` and `npm@10.8.2` to run, or `docker@26.0.1`.

## SETUP

Copy `.env.local` to `.env` and write your actual values.

## RUN

Select your preferred method:

#### NPM

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
docker compose down --remove-orphans
docker compose up -d
```

Navigate to [http://localhost:3000](http://localhost:3000) to start using the app.

## BUILD

```bash
docker build -t jorgemartinezpizarro/bookmarks:latest . 
docker push jorgemartinezpizarro/bookmarks:latest
```
