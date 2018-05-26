FROM node:10.1-alpine
WORKDIR /home/evediscord
VOLUME /home/evediscord/conf
VOLUME /home/evediscord/data
COPY package ./
RUN npm install
CMD [ "node", "index.js" ]