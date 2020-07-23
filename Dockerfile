FROM node:14.3.0

ARG SCRIPT="start"
ENV SCRIPT_ENV=${SCRIPT}

MAINTAINER woochanlee <030219woo@naver.com>

RUN mkdir -p /app
WORKDIR /app
ADD . /app

RUN npm install

CMD ["sh", "-c", "npm run ${SCRIPT_ENV}"]

EXPOSE 5000