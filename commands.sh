#!/bin/bash
#
# Deploy script for www.joseph-dunne.com
#

SRC_PATH="./src"
DIST_PATH="./src"
S3_BUCKET=s3://joseph-dunne.com

#
# Helper functions.
#

# Bold.
function _bld {
  echo -e "\033[1m$@\033[0m"
}

# Italic.
function _itl {
  echo -e "\033[3m$@\033[0m"
}

# Underlined.
function _udl {
  echo -e "\033[4m$@\033[0m"
}

# Check if command exists. If it doesn't, exit.
function command_exists_or_exit {
  command -v "$1" >/dev/null 2>&1 || {
    echo >&2 "Command \"$1\" required. Aborting."
    exit 1
  }
}

#
# Commands.
#

function run_local_server {
  cd $SRC_PATH
  python3 -m http.server
}

function compile_less {
  local file="$1"
  local dist="$2"
  lessc "$file" "$dist"
}

function compile_less_file_to_css_file {
  local file="$1"
  local dist=${file%.less}
  dist=$(echo "${dist}.css")
  compile_less "$file" "$dist"
}

function compile_all_less_files_to_css_files {
  find "$SRC_PATH" -type f -name "*.less" | while read file; do
    compile_less_file_to_css_file "$file"
  done
}

function watch_files_for_changes {
  command_exists_or_exit "fswatch"
  fswatch -0 -r -e ".*" -i "\\.less$" "$SRC_PATH" | while read -d "" event
  do
    #TODO: Check for delete event.
    compile_less_file_to_css_file "$event"
  done
}

# Starts local version of the website.
function rundev_command {
  mkdir -p dist
  cd node-scripts
  node rundev.js rundev
  exit 0
}

# Builds the website.
function build_command {
  rm -rf dist
  mkdir dist
  cd node-scripts
  node rundev.js build
  exit 0
}

# Uploads website to s3.
function deploy_command {
  aws s3 cp $SRC_PATH $S3_BUCKET --delete --acl public-read
  exit 0
}

# Print usage of this script.
function printusage_command {
  echo 
  _bld "Usage:"
  echo "    ./commands.sh $(_udl command)"
  echo
  _bld "command:"
  echo "    rundev - Run local dev version."
  echo "    deploy - Deploy website."
  echo
  exit 0
}

#
# Main handler.
#

function main_func {
  if [ "$1" = "rundev" ]; then
    rundev_command "${@:2}"

  elif [ "$1" = "build" ]; then
    build_command "${@:2}"

  elif [ "$1" = "deploy" ]; then
    deploy_command "${@:2}"

  elif [ -z "$1" ]; then
    printusage_command "${@:2}"

  else
    echo "Unknown command \"$1\""
    exit 1

  fi
}

main_func "$@"
