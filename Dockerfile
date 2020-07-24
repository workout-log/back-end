FROM node:12

ARG SCRIPT
ENV SCRIPT_ENV=${SCRIPT}
RUN echo ${SCRIPT_ENV}
LABEL woochanlee <030219woo@naver.com>

RUN mkdir -p /app
WORKDIR /app
ADD . /app

RUN yarn install

CMD ["sh", "-c", "yarn cross-env ${SCRIPT_ENV} ts-node src"]

EXPOSE 5000