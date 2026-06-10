FROM node:20

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash coreutils \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g ts-node typescript
WORKDIR /runner

COPY run.sh /runner/run.sh
RUN chmod +x /runner/run.sh

CMD ["/bin/bash"]
