declare module 'react-native-version-check-expo' {
  interface NeedUpdateResult {
    isNeeded: boolean;
    currentVersion: string;
    latestVersion: string;
  }

  interface VersionCheckStatic {
    /**
     * Get current app version from package.json
     */
    getCurrentVersion(): string;

    /**
     * Get current build number (versionCode on Android, CFBundleVersion on iOS)
     */
    getCurrentBuildNumber(): number;

    /**
     * Get latest version from App Store (iOS) or Play Store (Android)
     */
    getLatestVersion(): Promise<string>;

    /**
     * Check if update is needed
     */
    needUpdate(): Promise<NeedUpdateResult>;

    /**
     * Get store URL for the app
     * - iOS: App Store URL
     * - Android: Play Store URL
     */
    getStoreUrl(): string;

    /**
     * Get country code from device
     */
    getCountry(): Promise<string>;

    /**
     * Get package name (Android) or bundle identifier (iOS)
     */
    getPackageName(): string;
  }

  const VersionCheck: VersionCheckStatic;
  export default VersionCheck;
}
