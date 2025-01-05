## ABOUT

A private extension for Nextcloud.

It provides:

- customizable views combining nextjs and nextcloud
- view to Train using your own GPT (Work in progress)
- view to manage Lightning Network (Work in progress)
- custom games using CSS HTML and Javascript (compatible with android mac linux windows ...) (Work in progress)
- custom report overview (Work in progress)

This is a [next.js](https://nextjs.org/) project created with [create-next-app](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

Created and tested using `node@22.12`, `npm@11.0.0` and `docker@26.0.1`.

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

Run both the UI and stockfish dockerized:

```bash
git clone git@github.com:JorgeMartinezPizarro/bookmarks.git
copy .env bookmarks/.env
cd bookmarks
docker compose up -d
```

Navigate to [http://localhost:3000](http://localhost:3000) to start using the app.

## BUILD

To build the dockerized UI:

```bash
docker build -t jorgemartinezpizarro/bookmarks:latest . 
docker push jorgemartinezpizarro/bookmarks:latest
```

To build the Stockfish container:
```bash
cd tools/chess
docker build -t jorgemartinezpizarro/stockfish:latest . 
docker push jorgemartinezpizarro/stockfish:latest
```

To build the Wordlist container:
```bash
cd tools/words
docker build -t jorgemartinezpizarro/wordlist:latest . 
docker push jorgemartinezpizarro/wordlist:latest
```

Change the strings `jorgemartinezpizarro/NAME` to you own hub docker namespace.

## NOTE

It is required to link the app with a nextcloud valid URL, otherwise the app will not work. 

Alternatively you can just comment out the middleware.ts 