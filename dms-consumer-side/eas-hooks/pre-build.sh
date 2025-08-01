#!/bin/bash

echo "Creating google-services.json..."

# Create the directory
mkdir -p android/app

# Create google-services.json with exact content
cat > android/app/google-services.json << 'EOF'
{
  "project_info": {
    "project_number": "601621111546",
    "project_id": "dms-mart",
    "storage_bucket": "dms-mart.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:601621111546:android:ca80f9707a3245eaf09f43",
        "android_client_info": {
          "package_name": "com.dmsm.dmsconsumerside"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "AIzaSyBaIBgdRp-5f1Lvgz0yrC9SqEiA87khNeY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF

echo "google-services.json created successfully"
ls -la android/app/google-services.json
cat android/app/google-services.json 