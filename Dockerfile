FROM node:12

ARG SCRIPT
ENV SCRIPT_ENV=${SCRIPT}

LABEL woochanlee <030219woo@naver.com>

RUN mkdir -p /app
WORKDIR /app
ADD . /app

RUN rm yarn.lock
RUN rm package-lock.json

RUN yarn install

CMD ["sh", "-c", "yarn cross-env ${SCRIPT_ENV} ts-node src"]

EXPOSE 5000