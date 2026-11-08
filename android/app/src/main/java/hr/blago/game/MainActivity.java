package hr.blago.game;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean immersive = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyImmersive();
        hookBlagoFs();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (immersive) applyImmersive();
        hookBlagoFs();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && immersive) applyImmersive();
    }

    private void hookBlagoFs() {
        try {
            Bridge b = getBridge();
            if (b == null) return;
            WebView wv = b.getWebView();
            if (wv == null) return;
            stiliziraj(wv);
            wv.addJavascriptInterface(new BlagoFs(), "BlagoFs");
        } catch (Exception ignored) {
        }
    }

    private void stiliziraj(WebView wv) {
        wv.setBackgroundColor(Color.parseColor("#2B1814"));
        wv.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        WebSettings postavke = wv.getSettings();
        if (Build.VERSION.SDK_INT >= 33) {
            postavke.setAlgorithmicDarkeningAllowed(false);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            postavke.setForceDark(WebSettings.FORCE_DARK_OFF);
        }
    }

    private void applyImmersive() {
        Window w = getWindow();
        if (w == null) return;
        w.setBackgroundDrawable(new ColorDrawable(Color.parseColor("#2B1814")));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            w.setDecorFitsSystemWindows(false);
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            View d = w.getDecorView();
            d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
    }

    private void showBars() {
        Window w = getWindow();
        if (w == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
            }
        } else {
            View d = w.getDecorView();
            d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }

    public class BlagoFs {
        @JavascriptInterface
        public boolean isImmersive() {
            return immersive;
        }

        @JavascriptInterface
        public void enter() {
            runOnUiThread(() -> {
                immersive = true;
                applyImmersive();
            });
        }

        @JavascriptInterface
        public void exit() {
            runOnUiThread(() -> {
                immersive = false;
                showBars();
            });
        }

        @JavascriptInterface
        public void toggle() {
            runOnUiThread(() -> {
                immersive = !immersive;
                if (immersive) applyImmersive();
                else showBars();
            });
        }
    }
}
