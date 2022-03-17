# LinuxFest-Website-backend
back-end of LinuxFest website

To use docker, the file structure should be like below:
```
.
├── docker-compose.yml
├── backend
│   └── linuxfest-backend
│       ├── Dockerfile
│       ├── .env.db
│       ├── .env.dev
│       └── src/
└── nginx
    ├── Dockerfile
    ├── nginx.conf
    ├── front/
    └── panel/
```
NOTE: Rename .env.dev.test to .env.dev and also .env.db.test to .env.db

And to build and create a container run these lines:
```
docker-compose --env-file ./backend/linuxfest-backend/.env.db -f docker-compose.yml build
docker-compose --env-file ./backend/linuxfest-backend/.env.db -f docker-compose.yml up
```
