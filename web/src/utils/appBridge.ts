
export const isMobileApp = () => {
    return navigator.userAgent.includes("X5_APP_CLIENT");
};

export const sendToApp = (command: string, data: any = {}) => {
    if ((window as any).flutter_inappwebview && (window as any).flutter_inappwebview.callHandler) {
        (window as any).flutter_inappwebview.callHandler(command, data);
    } else {
        console.warn("Bridge not found. Are we in the app?");
    }
};
