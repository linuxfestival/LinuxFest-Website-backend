FROM nginx:1.21-alpine

# first remove the current existing config
RUN rm /etc/nginx/conf.d/default.conf
# then copy the config file to the container
COPY nginx.conf /etc/nginx/conf.d