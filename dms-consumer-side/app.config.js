module.exports = {
  expo: {
    name: "dms-consumer-side",
    slug: "dms-consumer-side",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/dms-logo.png",
    scheme: "dmsconsumerside",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to location to show nearby stores and delivery areas.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs access to location to show nearby stores and delivery areas."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/dms-logo.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.dmsm.dmsconsumerside",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      config: {
        googleMaps: {
          apiKey: "AIzaSyDxIJneZ8qgkgKLsffP46EENI-EGOdnCEU"
        }
      },
      reactNativeArchitectures: ["arm64-v8a"],
      googleServicesFile: "./google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/dms-logo.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/dms-logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-web-browser",
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow DMS Mart to use your location to show nearby stores and delivery areas."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/dms-logo.png",
          color: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "6f888ada-9941-4847-82a2-9c270500626d"
      }
    }
  }
};
