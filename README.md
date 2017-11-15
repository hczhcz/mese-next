MESE-Next and MESE-Realtime
===

About MESE
---

MESE (Management and Economics Simulation Exercise) is a business simulator which students create virtual companies, sell products, and compete in their companies' MPI (MESE Performance Index). The simulation is period-based. In each period, a virtual company will receive their reports and do five decisions: Price of their products, production in the next period, marketing investment, capital investment, and R&D investment.

MESE was created in 1980s. It is widely used by JA (Junior Achievement) in its course *JA Economics* to teach students knowledge of company management and economic environment. There is also a web-based MESE variant called [JA Titan](http://titan.ja.org/). Unfortunately, the use of MESE / JA Titan is discontinued in 2013.

MESE-Next
---

MESE-Next is a fan-made MESE variant. It is not an equivalent of MESE, but an online game based on a similar mathematical model to MESE. Players can sign up on a MESE-Next Server and compete with other players on the Internet. MESE-Next is created by [hczhcz](https://github.com/hczhcz) as a replacement of IMese (Internet-based MESE Platform).

### Difference between MESE-Next and MESE

* MESE-Next is web-based;
* MESE-Next supports more than 8 players in the same game (32 players maximum by default);
* MESE-Next supports more game settings;
* MESE-Next provides 8p-feeling settings in any game;
* Classic MESE have paper-based reports (for MESE-Next, the reports are web pages);
* Classic MESE supports bots;
* There are some slight differences in their mathematical model;

### Difference between MESE-Next and JA Titan

* MESE-Next is not a single website but a deployable web server;
* MESE-Next supports higher maximum players, higher maximum periods, and more settings;
* JA Titan supports pick-up games, and human-vs-bot games;

### Difference between MESE-Next and IMese

* MESE-Next does not need a MESE executable;
* MESE-Next supports higher maximum players, and multiple games at the same time;
* IMese supports encrypted connection;
* IMese has a history analyzing and player ranking system ([here](https://github.com/hczhcz/mese-player-ranking) is a standalone system);
* IMese only runs under x86 Windows environment;

MESE-Realtime
---

MESE-Realtime provides a new way to play business simulation games. Compare with MESE-Next, it runs every second without waiting for players' submissions. The typical length of a game is about 10-20 minutes, and players could change their five decisions at any time.

The Workflow
---

    MESE-Next Engine ---+--> MESE-Next Server ---+
                       /                          \
          Database ---+              Web Server ---+--> Web Browsers
                      |                            |
                      +--> MESE-Realtime Server ---+

Client Side Requirements
---

A browser supports HTML5, CSS3, and ES5 features is required to run MESE-Next and MESE-Realtime. The web frontend is tested under recent versions of Firefox, Chromium, and Mobile Safari.

The web frontend supports:

* Firefox 29+
* Chrome & Chromium 20+
* IE 10+
* Safari 7+
* Mobile Safari 7+

The web frontend probably works under:

* Firefox 3.6+
* Chrome & Chromium 4+
* MS Edge
* IE 8+
* Safari 5+
* Opera 11+
* Mobile Safari 5+
* Android Browser 4.1+

The web frontend would not support:

* IE 7-
* QQ (WeChat) Browser on Android

Server Side Requirements
---

The server requires all of:

* Node.js 0.12+
* MongoDB 2.4+
* Node.js packages: MongoDB, Express 4 & Compression, Socket.IO

MESE-Next requires:

* MESE-Next Engine binary

Installation
---

The server itself does not need installation.

Before running the server, you may do the following steps:

1. Clone this repository or [download it](https://github.com/hczhcz/mese-next/archive/master.zip);
2. Install Node.js and MongoDB;
3. Install NPM (Node.js Package Manager);
4. Install required NPM packages: `mongodb`, `express`, `compression` and `socket.io`;
5. Make sure MESE-Next Engine is under the same directory as MESE-Next Server's, and give it execution permission (`chmod +x`);
6. Edit `config.js` if you want to change some configurations;
7. Now, you could run `main.js` using Node.js.

You could skip step 5 and 6 and run MESE-Realtime only if you like.

License
---

MESE-Next and MESE-Realtime - Copyright (C) 2015-2017 hczhcz

This project is **only** distributed in GitHub and MESE China Group, and released **without** any warranty. This distribution is not under any public license. Commercial use and redistribution outside GitHub are not allowed without the author's permission. Please contact @hczhcz if you need a licensed version.

MESE-Next Engine

MESE-Next Engine in this repository is released **without** any warranty or copyright guarantee. Please use at your own risk.
