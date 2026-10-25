package com.duo.sanctuary;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private static final String SANCTUARY_URL = "https://duo-16pf.onrender.com/login";
    private int retryCount = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bridge bridge = getBridge();
        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                
                // Clear any legacy webview cache from old local development
                webView.clearCache(true);
            }

            bridge.addWebViewListener(new WebViewListener() {
                @Override
                public void onReceivedError(WebView view) {
                    if (retryCount < 20) {
                        retryCount++;
                        view.postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                view.loadUrl(SANCTUARY_URL);
                            }
                        }, 3000);
                    }
                }

                @Override
                public void onReceivedHttpError(WebView view) {
                    if (retryCount < 20) {
                        retryCount++;
                        view.postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                view.loadUrl(SANCTUARY_URL);
                            }
                        }, 3000);
                    }
                }

                @Override
                public void onPageLoaded(WebView view) {
                    retryCount = 0;
                }
            });
        }
    }
}

