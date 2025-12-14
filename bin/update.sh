#!/bin/bash

set -eu

cd $HOME/dot

uv run pyinfra @local configure.py

