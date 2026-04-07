export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
        // URL tracking for Odigo rooms is handled entirely in the background
        // service worker via tabs.onActivated and tabs.onUpdated.
        //
        // Keeping this file as a stub so content-script-specific features
        // (e.g. in-page UI injection) can be added here later without
        // restructuring the WXT entrypoint config.
    }
});
