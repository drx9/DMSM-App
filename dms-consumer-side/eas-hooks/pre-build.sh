#!/bin/bash

# Create google-services.json from environment variable
echo "$GOOGLE_SERVICES_JSON" > google-services.json

# Accept Android SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses 