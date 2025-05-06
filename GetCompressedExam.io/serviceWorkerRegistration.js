// Service worker registration
export function register() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL}/serviceWorker.js`;
        
        navigator.serviceWorker
          .register(swUrl)
          .then(registration => {
            console.log('ServiceWorker registration successful:', registration);
            
            // Check for updates when the page loads
            registration.update();
            
            // Periodically check for updates
            setInterval(() => {
              registration.update();
              console.log('Checking for service worker updates');
            }, 1000 * 60 * 60); // Check every hour
          })
          .catch(error => {
            console.error('ServiceWorker registration failed:', error);
          });
      });
    }
  }
  
  export function unregister() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          registration.unregister();
        })
        .catch(error => {
          console.error(error.message);
        });
    }
  }