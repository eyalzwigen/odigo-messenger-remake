export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
        const sendUrl = async () => {
            const attemptSend = (retries: number) => {
                browser.runtime.sendMessage({ 
                    type: 'active_link', 
                    url: window.location.href 
                }).catch(() => {
                    if (retries > 0) {
                        setTimeout(() => attemptSend(retries - 1), 500);
                    }
                });
            };

            attemptSend(5); // retry up to 5 times, 500ms apart
        };

        // initial page load
        sendUrl();

        // SPA navigation (pushState, replaceState)
        window.addEventListener('popstate', sendUrl);
        
        const originalPushState = history.pushState;
        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            sendUrl();
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            sendUrl();
        };
    }
});