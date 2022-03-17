# ############# #
# panel builder #
# ############# #

FROM node:14.7.0-alpine as panel_builder

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY ./panel/package*.json ./

# install project dependencies
RUN npm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY ./panel/ ./

# build app for production with minification
RUN npm run build


# ############# #
# front builder #
# ############# #

FROM node:14.7.0-alpine as front_builder

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY ./front/package*.json ./

# install project dependencies
RUN npm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY ./front .

# build app for production with minification
RUN npm run build



# ############# #
# NGINX builder #
# ############# #

FROM nginx:1.21-alpine

# remove default nginx index
RUN rm -rf /usr/share/nginx/html/*
WORKDIR /usr/share/nginx/html

RUN mkdir front
COPY --from=front_builder /app/dist ./front/

RUN mkdir panel
COPY --from=panel_builder /app/dist ./panel/

# first remove the current existing config
RUN rm /etc/nginx/conf.d/default.conf
# then copy the config file to the container
COPY nginx.conf /etc/nginx/conf.d