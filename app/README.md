# `/app`

This directory contains the source code for the React Native client for this project. It is built using Expo and written in Typescript.

You can view the Expo project [here](https://expo.dev/accounts/mmcardle/projects/gas-me-up).

## Development

To start the Expo development server run `npm run start`. This will provide a QR code in the console that can be scanned to load on a mobile device, or you can then send the build to a running simulator on your local device.

## Build

Before building you likely need to bump the versions. The versioning of our app is managed through `standard-version-expo`. To bump versions before creating a new build run `npm run bump`.

To build the application run `npm run build`. This will start a build on EAS which can then be submit to either the Google Play Store or the Apple App Store.

### Submission

To submit a completed build run `npm run publish`. This will prompt you to then send the build to [App Store Connect](https://appstoreconnect.apple.com/apps/1662998670/appstore/ios/version/inflight). If you wish to update the Expo build accessible on the Expo Go app, run `npm run publish:expo`.
