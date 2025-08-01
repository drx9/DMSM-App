#!/bin/bash

echo "Setting up google-services.json..."

# Create the directory
mkdir -p android/app

# Copy the file from root to android/app
cp google-services.json android/app/google-services.json

echo "google-services.json copied successfully"
ls -la android/app/google-services.json 