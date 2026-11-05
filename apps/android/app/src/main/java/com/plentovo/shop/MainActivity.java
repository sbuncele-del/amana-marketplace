package com.plentovo.shop;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String SHOP = BuildConfig.STOREFRONT_URL;
    private WebView shop;
    private LinearLayout recovery;
    private String retryUrl = SHOP;

    @Override
    public void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xfffaf8f5);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets edges = insets.getInsets(WindowInsets.Type.systemBars()
                    | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(edges.left, edges.top, edges.right, edges.bottom);
            }
            return insets;
        });
        shop = new WebView(this);
        WebSettings settings = shop.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        shop.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return request.isForMainFrame() && openOutsideShop(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openOutsideShop(Uri.parse(url));
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showRecovery(request.getUrl());
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse error) {
                if (request.isForMainFrame() && error.getStatusCode() >= 500) showRecovery(request.getUrl());
            }
        });
        root.addView(shop);

        recovery = new LinearLayout(this);
        recovery.setOrientation(LinearLayout.VERTICAL);
        recovery.setGravity(Gravity.CENTER);
        recovery.setBackgroundColor(0xfffaf8f5);
        recovery.setVisibility(View.GONE);
        TextView message = new TextView(this);
        message.setText("Plentovo couldn't load. Check your connection and try again.");
        message.setGravity(Gravity.CENTER);
        recovery.addView(message);
        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setOnClickListener(view -> loadShop(retryUrl));
        recovery.addView(retry);
        Button home = new Button(this);
        home.setText("Back to shop");
        home.setOnClickListener(view -> loadShop(SHOP));
        recovery.addView(home);
        root.addView(recovery, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::goBack);
        }
        if (savedState == null || shop.restoreState(savedState) == null) loadShop(SHOP);
    }

    private static boolean isShop(Uri uri) {
        String host = uri.getHost();
        return "https".equals(uri.getScheme())
            && ("plentovo.com".equalsIgnoreCase(host) || "www.plentovo.com".equalsIgnoreCase(host))
            && uri.getUserInfo() == null && (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private boolean openOutsideShop(Uri uri) {
        if (isShop(uri)) return false;
        String scheme = uri.getScheme();
        if ("https".equals(scheme) || "mailto".equals(scheme) || "tel".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
                Toast.makeText(this, "No app can open this link.", Toast.LENGTH_SHORT).show();
            }
        }
        return true;
    }

    private void showRecovery(Uri failed) {
        retryUrl = isShop(failed) ? failed.toString() : SHOP;
        shop.setVisibility(View.INVISIBLE);
        recovery.setVisibility(View.VISIBLE);
    }

    private void loadShop(String url) {
        recovery.setVisibility(View.GONE);
        shop.setVisibility(View.VISIBLE);
        shop.loadUrl(url);
    }

    private void goBack() {
        if (recovery.getVisibility() == View.VISIBLE) {
            if (!shop.canGoBack()) {
                finish();
                return;
            }
            recovery.setVisibility(View.GONE);
            shop.setVisibility(View.VISIBLE);
        }
        if (shop.canGoBack()) shop.goBack();
        else finish();
    }

    @Override
    public void onBackPressed() {
        goBack();
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        shop.saveState(state);
        super.onSaveInstanceState(state);
    }
}
