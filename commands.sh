#!/bin/bash
#
# Deploy script for www.joseph-dunne.com
#

SRC_PATH="./src"
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

#
# Commands.
#

# Starts local version of the website.
function rundev_command {
  cd $SRC_PATH
  python3 -m http.server
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
