FROM ubuntu:18.04

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

RUN groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

RUN apt-get update -y && apt-get install -y git nodejs npm libxml2

RUN git clone https://github.com/emscripten-core/emsdk.git && \
  cd emsdk && \
  ./emsdk install 1.38.45 && \
  ./emsdk activate 1.38.45

ENV PATH="/emsdk:/emsdk/fastcomp/emscripten:/emsdk/node/12.9.1_64bit/bin:${PATH}"
ENV EMSDK=/emsdk
ENV EM_CONFIG=/root/.emscripten
ENV EMSDK_NODE=/emsdk/node/12.9.1_64bit/bin/node

# The node image includes a non-root user with sudo access. Use the "remoteUser"
# property in devcontainer.json to use it. On Linux, the container user's GID/UIDs
# will be updated to match your local UID/GID (when using the dockerFile property).
# See https://aka.ms/vscode-remote/containers/non-root-user for details.
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

ENV DEBIAN_FRONTEND=dialog

