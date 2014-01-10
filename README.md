#Vis

Vis (working title) is a Twisted web server and D3.js visualization that works in conjunction with the [Drench](https://github.com/jefflovejapan/drench) BitTorrent client. Each "piece" downloaded is color-coded to identify its seeder and appears in its exact location inside the downloaded file(s). Lastly, clicking a piece discloses both the seeder's IP address and geographic location.

#Install

The easiest way to install vis is to simply clone this Git repository. Afterward, entering

    $ python vis.py

from the command line will start up the web server, which will listen for connections on two ports by default -- port 8002 (for incoming Drench connections) and port 80 (for incoming browser / client connections).

#Status

While multifile torrents work as expected, right now Vis lacks support for single-file torrents. Planned feature additions:
- make everything responsive, not just list of peers in header
- add ability to highlight all pieces downloaded from a single seeder