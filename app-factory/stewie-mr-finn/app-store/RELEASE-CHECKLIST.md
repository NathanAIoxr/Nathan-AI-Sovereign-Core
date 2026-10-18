# Release 6.1.0 (8) — submission gates

This source preparation is not a signed or device-tested App Store release.

- [ ] Green cloud Mac compile and native/browser test results on this exact commit.
- [ ] Select installed Xcode with iOS SDK 26 or later; workflow fails early on older SDKs. Recheck current Apple submission requirements at upload time.
- [ ] Configure existing signing workflow secrets: APPLE_CERTIFICATE_P12_BASE64, APPLE_CERTIFICATE_PASSWORD, APPLE_PROVISIONING_PROFILE_BASE64, APPLE_TEAM_ID. Use Apple Distribution certificate and App Store provisioning profile for this bundle ID. Never put secrets in source or chat.
- [ ] Run signed workflow on this branch with distribution app-store-connect. It exports an IPA; it does not upload or submit automatically.
- [ ] Validate signed archive in Xcode/Transporter and upload to App Store Connect; wait for processing.
- [ ] Test on a physical iPhone through TestFlight: launch in airplane mode, every menu route, original boards, all polar chapters, quit/relaunch mid-chapter, replay reward rules, sticker restoration, sound and motion controls, system Reduce Motion, VoiceOver and large text. Check small-screen layouts.
- [ ] Verify actual cat markings against approved reference images. Existing generated artwork is not approved by this checklist.
- [ ] Capture genuine release screenshots for device sizes required by App Store Connect.
- [ ] Publish working public privacy and support pages, adding a real contact method.
- [ ] Complete listing, review contact, pricing, territories, content rights, export compliance, age-rating and privacy questionnaires. Data Not Collected is appropriate only if the final binary retains the audited offline behavior.
- [ ] If selecting Kids category, verify its current requirements and parental gates for any future external links or purchases.
- [ ] Choose manual release, then submit the tested build for review.

Apple references: https://developer.apple.com/app-store/submitting/ and https://developer.apple.com/app-store/review/guidelines/
