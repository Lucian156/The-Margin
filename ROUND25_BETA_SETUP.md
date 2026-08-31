# The Margin Round 25 Beta Setup Instructions

To enable seamless tester access for **THE MARGIN ROUND 25 BETA**, ensure Anonymous Authentication is enabled in your Firebase Project Console.

## Firebase Console Steps
1. Go to [Firebase Console](https://console.firebase.google.com).
2. Select your project: **sunlit-citron-gt8c4**.
3. In the left sidebar, navigate to **Build** -> **Authentication**.
4. Select the **Sign-in method** tab.
5. Under **Additional providers**, select **Anonymous**.
6. Toggle **Enable** to ON and click **Save**.

---

## Active Database & Round 25 Specs
- **Database ID**: `ai-studio-themargin-1d7b3b79-b870-42dd-9935-f045cc08d1cb`
- **Canonical Round ID**: `nrl-2026-round-25`
- **Total Fixtures**: 8 scheduled games
- **Prediction Collection**: `predictions/{uid_fixtureId}`
- **User Document**: `users/{uid}` with `accessMode: "round-25-beta"`
