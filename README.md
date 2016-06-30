MESE-Next Server
===

About MESE
---

MESE (Management and Economics Simulation Exercise) is a business simulator which students create virtual companies, sell products, and compete in their companies' MPI (MESE Performance Index). The simulation is period-based. In each period, a virtual company will receive their reports and do five decisions: Price of their products, production in the next period, marketing investment, capital investment, and R&D investment.

MESE was created in 1980s. It is widely used by JA (Junior Achievement) in its course *JA Economics* to teach students knowledge of company management and economic environment. There is also a web-based MESE variant called [JA Titan](http://titan.ja.org/). Unfortunately, the use of MESE / JA Titan is discontinued in 2013.

MESE-Next
---

MESE-Next is a fan-made MESE variant. It is not an equivalent of MESE, but an online game based on a similar mathematical model to MESE. Players can sign up on a MESE-Next Server and compete with other players on the Internet. MESE-Next is created by [hczhcz](https://github.com/hczhcz) as a replacement of IMese (Internet-based MESE Platform).

> Workflow: MESE-Next Engine <=> MESE-Next Server <=> Web Browsers

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
* IMese has a history analysing and player ranking system ([here](https://github.com/hczhcz/mese-player-ranking) is a standalone system);
* IMese only runs under x86 Windows environment;

Client Side Requirements
---

A browser supports HTML5, CSS3, and ES5 features is required to run MESE-Next. The web frontend is tested under recent versions of Firefox, Chromium, and Mobile Safari.

MESE-Next Frontend supports:

* Firefox 29+
* Chrome & Chromium 20+
* IE 10+
* Safari 7+
* Mobile Safari 7+

MESE-Next Frontend probably works under:

* Firefox 3.6+
* Chrome & Chromium 4+
* MS Edge
* IE 8+
* Safari 5+
* Opera 11+
* Mobile Safari 5+
* Android Browser 4.1+

MESE-Next does not support:

* IE 7-
* QQ (WeChat) Browser on Android

Server Side Requirements
---

MESE-Next Server requires all of:

* Node.js 0.12+
* MongoDB 2.4+
* Node.js packages: MongoDB, Express 4 & Compression, Socket.IO
* MESE-Next Engine (released in MESE China Group)

Installation
---

MESE-Next Server itself does not need installation.

Before running MESE-Next, you may do the following steps:

1. Clone this repository or [download it](https://github.com/hczhcz/mese-next/archive/master.zip);
2. Install Node.js and MongoDB;
3. Install NPM (Node.js Package Manager);
4. Install required packages: `mongodb`, `express`, `compression` and `socket.io`;
5. Get MESE-Next Engine from our group or by contacting us, and put it under the same directory as MESE-Next Server's;
6. Edit `config.js` if you want to change some configurations;
7. Now, you could run `mese.js` using Node.js.

License
---

MESE-Next - Copyright (C) 2015-2016 hczhcz

MESE-Next is **only** distributed in GitHub and MESE China Group, and released **without** any warranty. As this distribution is not under any public license, commercial use, public use, and redistribution outside GitHub are not allowed. Contact us if you need a licensed version.
