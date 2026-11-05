# Plentovo for Huawei AppGallery

This first Android device-test build opens the South African Plentovo storefront over HTTPS. It uses the same product, account and cart flows as the web storefront. The app has Android back navigation and a recovery screen for failed page loads. It uses the Android system WebView and has no Google Play Services dependency.

`com.plentovo.shop` is the proposed package name. Verify availability in AppGallery Connect and settle signing ownership before creating the release record. Keep release keys outside this repository.

## Build and test

Use JDK 17, Gradle 8.13, Android SDK platform 36 and Build Tools 35.0.0. From `apps/android` run `gradle :app:assembleDebug`. Install `app/build/outputs/apk/debug/app-debug.apk` on a Huawei test device.

1. Browse categories and open a product. Scroll through recommendations and use Android Back.
2. Save a favourite, add an in-stock product to the cart, then reopen the app and verify both persist.
3. Test sign-in, delivery selection and checkout up to the existing payment state without placing a live order. Test any supported external payment or sign-in handoff and return before release.
4. Open Help, privacy and external support links. Disconnect the network, trigger an error, reconnect and retry.
5. Check keyboard insets, status bar and bottom navigation on the target Huawei device.

## Before submission

Confirm the owner-controlled AppGallery Connect account and package name, create and sign a release build, and capture screenshots on Huawei hardware. Review the listing, privacy disclosures, country selection and AppGallery review requirements against the tested build. The existing policy is https://plentovo.com/privacy. The debug APK is for device testing.
